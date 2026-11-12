CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

--> statement-breakpoint

CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "orders_quantity_positive" CHECK ("orders"."quantity" > 0)
);

--> statement-breakpoint

CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"price" integer NOT NULL,
	"stock" integer NOT NULL,
	CONSTRAINT "products_name_unique" UNIQUE("name"),
	CONSTRAINT "products_price_not_negative" CHECK ("products"."price" >= 0),
	CONSTRAINT "products_stock_not_negative" CHECK ("products"."stock" >= 0)
);

--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
