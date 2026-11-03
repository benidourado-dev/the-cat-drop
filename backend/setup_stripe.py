import os
import stripe
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

CATALOG = [
    {
        "emergent_product_id": "apoie_o_gato",
        "name": "Apoie o Gato — The Cat Drop",
        "tax_code": "txcd_10000000",
        "prices": [
            {"lookup_key": "tip_miau", "amount": 500, "currency": "brl"},
            {"lookup_key": "tip_ronron", "amount": 1000, "currency": "brl"},
            {"lookup_key": "tip_drop_vip", "amount": 2000, "currency": "brl"},
        ],
    },
]


def ensure_tax_settings():
    # Stripe Tax is not supported in BR sandboxes — skipping (tax_mode "diy")
    print("tax settings skipped (not supported in BR)")


def get_or_create_product(entry):
    for p in stripe.Product.list(active=True).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == entry["emergent_product_id"]:
            return p
    return stripe.Product.create(name=entry["name"], tax_code=entry.get("tax_code"),
                                 metadata={"managed_by": "emergent", "emergent_product_id": entry["emergent_product_id"]})


def main():
    ensure_tax_settings()
    for entry in CATALOG:
        product = get_or_create_product(entry)
        print("product:", product.id, product.name)
        for p in entry["prices"]:
            existing = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
            if existing and (existing[0].unit_amount != p["amount"] or existing[0].currency != p["currency"]):
                stripe.Price.modify(existing[0].id, active=False)
                existing = []
            if not existing:
                stripe.Price.create(product=product.id, unit_amount=p["amount"], currency=p["currency"],
                                    lookup_key=p["lookup_key"], transfer_lookup_key=True)
                print("  price created:", p["lookup_key"], p["amount"], p["currency"])
            else:
                print("  price ok:", p["lookup_key"])


if __name__ == "__main__":
    main()
