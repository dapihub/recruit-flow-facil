
-- ─── PRODUCTS ─────────────────────────────────────────────
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
  current_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, sku)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products company access" ON public.products FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── STOCK MOVEMENTS ──────────────────────────────────────
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in','out','adjust')),
  quantity NUMERIC(14,3) NOT NULL,
  unit_cost NUMERIC(14,2),
  reason TEXT,
  reference TEXT,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements company access" ON public.stock_movements FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'in' THEN
      UPDATE public.products SET current_stock = current_stock + NEW.quantity WHERE id = NEW.product_id;
    ELSIF NEW.type = 'out' THEN
      UPDATE public.products SET current_stock = current_stock - NEW.quantity WHERE id = NEW.product_id;
    ELSE
      UPDATE public.products SET current_stock = NEW.quantity WHERE id = NEW.product_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'in' THEN
      UPDATE public.products SET current_stock = current_stock - OLD.quantity WHERE id = OLD.product_id;
    ELSIF OLD.type = 'out' THEN
      UPDATE public.products SET current_stock = current_stock + OLD.quantity WHERE id = OLD.product_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_stock_apply
AFTER INSERT OR DELETE ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- ─── SUPPLIERS ────────────────────────────────────────────
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers company access" ON public.suppliers FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── PURCHASE ORDERS ──────────────────────────────────────
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','received','cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_orders company access" ON public.purchase_orders FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE TRIGGER trg_purchase_orders_updated BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_items TO authenticated;
GRANT ALL ON public.purchase_items TO service_role;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_items company access" ON public.purchase_items FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- ─── SALES ORDERS ─────────────────────────────────────────
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','invoiced','cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT ALL ON public.sales_orders TO service_role;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_orders company access" ON public.sales_orders FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE TRIGGER trg_sales_orders_updated BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_items TO authenticated;
GRANT ALL ON public.sales_items TO service_role;
ALTER TABLE public.sales_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_items company access" ON public.sales_items FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- ─── VACATIONS ────────────────────────────────────────────
CREATE TABLE public.vacations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','denied','taken')),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vacations TO authenticated;
GRANT ALL ON public.vacations TO service_role;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vacations company access" ON public.vacations FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE TRIGGER trg_vacations_updated BEFORE UPDATE ON public.vacations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── TIMESHEET ────────────────────────────────────────────
CREATE TABLE public.timesheet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  work_date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  break_minutes INT NOT NULL DEFAULT 0,
  total_hours NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timesheet TO authenticated;
GRANT ALL ON public.timesheet TO service_role;
ALTER TABLE public.timesheet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timesheet company access" ON public.timesheet FOR ALL
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE TRIGGER trg_timesheet_updated BEFORE UPDATE ON public.timesheet
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── NOTIFICATIONS ────────────────────────────────────────
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications own access" ON public.notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── SEQUENCES for numbering ──────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.purchase_order_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.sales_order_seq START 1;
