"""Seed transactions from bundled CSV logic."""
from __future__ import annotations

import uuid

SEED_ROWS = """Date,Description,Amount (MAD),Type
2026-08-31,Transportation,5.0,Expense
2026-08-31,Food,59.0,Expense
2026-08-31,Main to Savings,7000.0,Transfer
2026-08-31,interest,5.56,Income
2026-08-31,Savings initial balance,3700.0,Previous Balance
2026-08-31,Salary,9089.0,Income
2026-08-31,internet,69.0,Expense
2026-09-01,Transportation,5.0,Expense
2026-09-01,Food,55.5,Expense
2026-09-01,Family,10.0,Expense
2026-09-02,Transportation,5.0,Expense
2026-09-02,Food,10.0,Expense
2026-09-02,Food,5.0,Expense
2026-09-02,Transportation,5.0,Expense
2026-09-04,gift,700.0,Expense
2026-09-04,Food,255.0,Expense
2026-09-05,Food,147.0,Expense
2026-09-05,Transportation,36.0,Expense
2026-09-08,Food,20.0,Expense
2026-09-08,Food,10.0,Expense
2026-09-08,Transportation,230.0,Expense
2026-09-08,Food,20.0,Expense
2026-09-08,Transportation,20.0,Expense
2026-09-08,gift,215.0,Expense
2026-09-08,Food,59.0,Expense
2026-09-09,Transportation,10.0,Expense
2026-09-09,Food,102.0,Expense
2026-09-09,Savings to Main,700.0,Transfer
2026-09-20,Food,650.0,Expense
2026-09-20,Transportation,267.09,Expense
2026-09-20,gift,1200.0,Expense
2026-09-20,Savings to Main,2000.0,Transfer"""


def normalize_type(raw: str) -> str:
    t = raw.strip().lower()
    if t == "expense":
        return "expense"
    if t == "income":
        return "income"
    if t == "transfer":
        return "transfer"
    if "previous" in t:
        return "previous_balance"
    return "expense"


def normalize_category(description: str, tx_type: str) -> str:
    d = description.lower().strip()
    if tx_type == "transfer":
        return "transfer"
    if tx_type == "previous_balance" or "initial balance" in d:
        return "previous_balance"
    if "salary" in d:
        return "salary"
    if "interest" in d:
        return "interest"
    if "transport" in d:
        return "transportation"
    if "food" in d:
        return "food"
    if "gift" in d:
        return "gifts"
    if "family" in d:
        return "family"
    if "internet" in d:
        return "internet"
    if tx_type == "income":
        return "other_income"
    return "other_expense"


def parse_transfer_accounts(description: str) -> tuple[str, str]:
    d = description.lower()
    if "savings to main" in d:
        return "savings", "main"
    if "main to savings" in d:
        return "main", "savings"
    return "main", "savings"


def infer_account(description: str, tx_type: str, category: str) -> str:
    if category == "interest" or "interest" in description.lower():
        return "savings"
    if tx_type == "previous_balance" and "savings" in description.lower():
        return "savings"
    return "main"


def seed_transactions() -> list[dict]:
    lines = SEED_ROWS.strip().splitlines()
    rows = []
    for line in lines[1:]:
        if not line.strip():
            continue
        parts = line.split(",")
        date = parts[0].strip()
        description = parts[1].strip()
        amount = abs(float(parts[2]))
        tx_type = normalize_type(parts[3] if len(parts) > 3 else "Expense")
        category = normalize_category(description, tx_type)
        account = infer_account(description, tx_type, category)
        from_account = "main"
        to_account = "savings"
        if tx_type == "transfer":
            from_account, to_account = parse_transfer_accounts(description)
            account = from_account
        rows.append(
            {
                "id": str(uuid.uuid4()),
                "date": date,
                "description": description,
                "amount": amount,
                "type": tx_type,
                "category": category,
                "account": account,
                "fromAccount": from_account,
                "toAccount": to_account,
            }
        )
    return rows
