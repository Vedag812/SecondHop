'use client';

import { useState } from 'react';
import Link from '@/components/safe-link';
import Image from 'next/image';
import {
  ArrowRight,
  Camera,
  Headphones,
  Laptop,
  Mouse,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Watch,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { CATALOG_PARCELS, money } from '@/lib/rescue';
import { PRODUCTS, PRODUCT_IMAGES } from '@/lib/products';
import { useRescue } from './rescue-client';
import { CommerceCheckout } from './commerce-checkout';

const productImages = PRODUCT_IMAGES;

export function CommerceStore() {
  const { data, error, refresh } = useRescue();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  const [selected, setSelected] = useState('');

  const products = PRODUCTS.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      `${p.brand} ${p.model} ${p.variant}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  ).sort((a, b) =>
    sort === 'price'
      ? a.redirectPrice - b.redirectPrice
      : sort === 'savings'
        ? b.discountPercent - a.discountPercent
        : 0,
  );

  const selectedParcel = CATALOG_PARCELS.find((p) => p.productId === selected);

  return (
    <div className="rescue-app commerce-store">
      <div className="rescue-page-top">
        <div>
          <p className="rescue-eyebrow">
            <span className="size-2 rounded-full bg-orange-500"></span>
            LOCAL RETURN INVENTORY · VERIFIED FACTORY SEALED
          </p>
          <h1>
            Direct Hyperlocal Catalog.
            <br />
            <span className="text-orange-400">Zero Shipping Waste.</span>
          </h1>
          <p className="rescue-subtitle">
            Shop unopened, verified in-transit return parcels redirected to
            nearby local buyers at direct discounts.
          </p>
        </div>
        <Link href="/dashboard/agentic" className="commerce-agent-link">
          <Sparkles size={22} className="text-orange-400" />
          <div>
            <span className="text-xs font-mono text-slate-400 block">
              Looking for something specific?
            </span>
            <strong className="text-sm text-white font-semibold flex items-center gap-1">
              Ask AI Buyer Agent <ArrowRight size={14} />
            </strong>
          </div>
        </Link>
      </div>

      <div className="rescue-disclosure">
        <ShieldCheck size={16} className="text-emerald-400" />
        <span className="text-slate-300">
          Verified Catalog · {PRODUCTS.length} Hyperlocal Items · Protected
          Payment Rail · Condition Verified at Handoff
        </span>
        <span className="ml-auto font-mono text-xs text-emerald-400">
          Instant Checkout Active
        </span>
      </div>

      {error && <div className="rescue-error mb-5">{error}</div>}

      {selectedParcel && data && (
        <div className="my-6">
          <CommerceCheckout
            key={selected}
            parcel={selectedParcel}
            data={data}
            refresh={refresh}
            onClose={() => setSelected('')}
          />
        </div>
      )}

      <div className="commerce-toolbar">
        <label htmlFor="commerce-store-field-1" className="commerce-search">
          <Search size={18} />
          <Input
            id="commerce-store-field-1"
            className="rescue-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headphones, phones, laptops…"
            aria-label="Search products"
          />
        </label>
        <NativeSelect
          className="rescue-input max-w-[180px]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
        >
          <NativeSelectOption value="all">All Categories</NativeSelectOption>
          {[...new Set(PRODUCTS.map((p) => p.category))].map((cat) => (
            <NativeSelectOption key={cat} value={cat}>
              {PRODUCTS.find((p) => p.category === cat)?.categoryLabel}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          className="rescue-input max-w-[180px]"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
        >
          <NativeSelectOption value="featured">
            Featured First
          </NativeSelectOption>
          <NativeSelectOption value="price">
            Price: Low to High
          </NativeSelectOption>
          <NativeSelectOption value="savings">
            Highest Discount
          </NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="commerce-product-grid">
        {products.map((p, i) => {
          const Icon =
            p.category === 'phones'
              ? Smartphone
              : p.category === 'computing'
                ? p.model.includes('MX')
                  ? Mouse
                  : Laptop
                : p.category === 'wearables'
                  ? Watch
                  : p.category === 'cameras'
                    ? Camera
                    : Headphones;
          const media = productImages[p.id];
          const active = data?.workspace.cases.find(
            (c) => c.parcel.serial === p.serialNumber && c.state !== 'EXPIRED',
          );

          return (
            <article className="commerce-product-card" key={p.id}>
              <div className="commerce-product-media">
                <span className="commerce-discount">
                  -{p.discountPercent}% OFF
                </span>
                {media ? (
                  <Image
                    unoptimized
                    width={1200}
                    height={800}
                    src={media.url}
                    alt={`${p.brand} ${p.model}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="commerce-product-mark">
                    <Icon size={52} strokeWidth={1.5} />
                    <span>{p.brand}</span>
                  </div>
                )}
                <span className="commerce-condition font-mono">
                  {p.conditionLabel}
                </span>
              </div>

              <div className="commerce-product-info">
                <p className="rescue-eyebrow">{p.brand}</p>
                <h2>{p.model}</h2>
                <p className="text-xs text-slate-400 font-mono">{p.variant}</p>

                <div className="mt-4 flex items-baseline gap-3">
                  <strong className="text-2xl font-bold font-mono text-orange-400">
                    {money(p.redirectPrice * 100)}
                  </strong>
                  <span className="text-xs font-mono text-slate-500 line-through">
                    {money(p.retailPrice * 100)}
                  </span>
                </div>

                <p className="mt-2 text-xs font-mono text-slate-400">
                  📍 {p.buyerB.distanceKm} km local route · 1 unit at hub
                </p>

                <div className="mt-5">
                  <Button
                    className="rescue-primary w-full text-xs font-bold"
                    disabled={!data}
                    onClick={() => {
                      setSelected(p.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {active ? 'View Active Order' : 'Buy Now'}
                    <ArrowRight size={14} />
                  </Button>
                </div>

                {media && (
                  <a
                    href={media.source}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block text-[10px] font-mono text-slate-500 hover:text-slate-400 truncate"
                  >
                    Photo: {media.credit}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="rescue-empty">
          <h2>No matching items found.</h2>
          <p>
            Try searching for headphones, laptops, keyboards, or ask the AI
            buyer agent.
          </p>
        </div>
      )}
    </div>
  );
}
