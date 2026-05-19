ALTER TABLE public.cart
  ADD CONSTRAINT cart_session_product_unique UNIQUE (session_id, product_id);
