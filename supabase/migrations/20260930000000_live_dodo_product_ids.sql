-- Live-mode Dodo product IDs (test-mode IDs do not exist in live mode).
-- growth-400k intentionally NOT mapped: the live product is priced at $79 instead of $120.
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk3iJ4Q2CzzSDZmBbj' WHERE slug = 'pro-6k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk7EHhe9sltWnReEoX' WHERE slug = 'pro-10k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk6zkQtymWkjGFvdll' WHERE slug = 'pro-15k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk745LyRW0xSFXvSRR' WHERE slug = 'pro-25k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk79mw8Ld95qHtqUEm' WHERE slug = 'pro-50k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk7IulIzPESHDYSc3o' WHERE slug = 'growth-100k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk6uO12XXSNsiZUunE' WHERE slug = 'growth-200k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk6kK1Aln45NLtdLxu' WHERE slug = 'growth-600k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0Nojk6fVbQZXqdJyUOgKY' WHERE slug = 'growth-1m';
