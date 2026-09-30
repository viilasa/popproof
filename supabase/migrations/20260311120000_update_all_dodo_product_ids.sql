-- Update all Dodo Product IDs for Pro and Growth plans

-- Pro Plans
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaCHdSpqdCjutPjz24PU' WHERE slug = 'pro-6k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFqxWi5a1oUzWWnijg5' WHERE slug = 'pro-10k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFrBRTCNYPwdI297RBO' WHERE slug = 'pro-15k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFrJeYmEW79pEeO5OMb' WHERE slug = 'pro-25k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFrOUnZlfdPbinUUm8J' WHERE slug = 'pro-50k';

-- Growth Plans
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFTNhBufXF8iVetlbZN' WHERE slug = 'growth-100k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFrvtd5Au6Rp6TpVP7o' WHERE slug = 'growth-200k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFs11esjKjtFRKrKwLn' WHERE slug = 'growth-400k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFs5ej26ZmRozlVl6Ez' WHERE slug = 'growth-600k';
UPDATE subscription_plans SET dodo_product_id = 'pdt_0NaFs9pdzs3UaizoFB9hO' WHERE slug = 'growth-1m';
