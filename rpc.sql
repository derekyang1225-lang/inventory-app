create or replace function handle_inventory_transaction(
  p_product_id bigint,
  p_type text,
  p_quantity integer
) returns void as $$
begin
  -- 插入交易记录
  insert into transactions (product_id, type, quantity)
  values (p_product_id, p_type, p_quantity);

  -- 更新商品库存
  if p_type = 'IN' then
    update products
    set quantity = quantity + p_quantity
    where id = p_product_id;
  else
    update products
    set quantity = quantity - p_quantity
    where id = p_product_id;
  end if;
end;
$$ language plpgsql;
