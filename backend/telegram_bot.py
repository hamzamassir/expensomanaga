"""Telegram bot — quick expense: category button → amount → save."""
from __future__ import annotations

import asyncio
import logging
import os
import re
from datetime import date

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, MessageHandler, filters

from backend import store

log = logging.getLogger(__name__)

EXPENSE_CATEGORIES = [
    ("food", "Food"),
    ("transportation", "Transport"),
    ("gifts", "Gifts"),
    ("family", "Family"),
    ("internet", "Internet"),
    ("other_expense", "Other"),
]

PENDING_KEY = "pending_expense"


def _allowed_users() -> set[int]:
    raw = os.environ.get("TELEGRAM_ALLOWED_USER_IDS", "").strip()
    if not raw:
        return set()
    return {int(x.strip()) for x in raw.split(",") if x.strip().isdigit()}


def _is_allowed(user_id: int | None) -> bool:
    allowed = _allowed_users()
    if not allowed:
        log.warning("TELEGRAM_ALLOWED_USER_IDS is empty — bot rejects all users")
        return False
    return user_id in allowed


def _category_keyboard() -> InlineKeyboardMarkup:
    rows = []
    row: list[InlineKeyboardButton] = []
    for cat_id, label in EXPENSE_CATEGORIES:
        row.append(InlineKeyboardButton(label, callback_data=f"cat:{cat_id}"))
        if len(row) == 2:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append([InlineKeyboardButton("Close", callback_data="action:close")])
    return InlineKeyboardMarkup(rows)


def _parse_amount(text: str) -> float | None:
    cleaned = text.strip().replace(",", ".")
    if not re.fullmatch(r"\d+(?:\.\d{1,2})?", cleaned):
        return None
    value = float(cleaned)
    return value if value > 0 else None


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user or not _is_allowed(user.id):
        await update.effective_message.reply_text("Not authorized.")
        return
    context.user_data.pop(PENDING_KEY, None)
    await update.effective_message.reply_text(
        "Pick a category:",
        reply_markup=_category_keyboard(),
    )


async def close(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user or not _is_allowed(user.id):
        await update.effective_message.reply_text("Not authorized.")
        return
    context.user_data.pop(PENDING_KEY, None)
    await update.effective_message.reply_text("Done. Send /start when you want to log again.")


async def on_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query or not query.data or not query.data.startswith("cat:"):
        return
    await query.answer()
    user = update.effective_user
    if not user or not _is_allowed(user.id):
        await query.edit_message_text("Not authorized.")
        return

    cat_id = query.data.split(":", 1)[1]
    label = dict(EXPENSE_CATEGORIES).get(cat_id, cat_id)
    context.user_data[PENDING_KEY] = {"category": cat_id, "label": label}
    await query.edit_message_text(f"{label}\n\nAmount in MAD?")


async def on_amount(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    message = update.effective_message
    if not user or not message or not message.text:
        return
    if not _is_allowed(user.id):
        await message.reply_text("Not authorized.")
        return

    pending = context.user_data.get(PENDING_KEY)
    if not pending:
        await message.reply_text("Tap /start and pick a category first.")
        return

    amount = _parse_amount(message.text)
    if amount is None:
        await message.reply_text("Send a valid amount, e.g. 55 or 12.50")
        return

    settings = await asyncio.to_thread(store.get_settings)
    account = settings.get("defaultExpenseAccount") or "main"
    label = pending["label"]
    account_label = "Savings" if account == "savings" else "Main"

    await asyncio.to_thread(
        store.create_transaction,
        {
            "date": date.today().isoformat(),
            "description": label,
            "amount": amount,
            "type": "expense",
            "category": pending["category"],
            "account": account,
        },
    )

    context.user_data.pop(PENDING_KEY, None)
    text = f"Saved: {label} {amount:g} MAD ({account_label})"
    try:
        await message.reply_text(text, reply_markup=_category_keyboard())
    except Exception as err:
        log.exception("Failed to send Telegram confirmation")
        try:
            await message.reply_text(text)
        except Exception:
            log.exception("Retry confirmation also failed: %s", err)


async def on_action(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query or not query.data or not query.data.startswith("action:"):
        return
    await query.answer()
    user = update.effective_user
    if not user or not _is_allowed(user.id):
        await query.edit_message_text("Not authorized.")
        return

    action = query.data.split(":", 1)[1]
    context.user_data.pop(PENDING_KEY, None)

    if action == "close":
        await query.edit_message_text("Done. Send /start when you want to log again.")
        return


def build_application(token: str) -> Application:
    app = (
        Application.builder()
        .token(token)
        .connect_timeout(30)
        .read_timeout(30)
        .write_timeout(30)
        .pool_timeout(30)
        .build()
    )
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("close", close))
    app.add_handler(CallbackQueryHandler(on_category, pattern=r"^cat:"))
    app.add_handler(CallbackQueryHandler(on_action, pattern=r"^action:"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_amount))
    return app


def run_bot() -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        log.info("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled")
        return
    log.info("Starting Telegram bot…")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    app = build_application(token)
    app.run_polling(drop_pending_updates=True)
