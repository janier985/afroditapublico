import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_CATALOG_API_URL || 'https://afroditavirtual.com/public-catalog/tienda';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function App() {
  const [catalog, setCatalog] = useState(null);
  const [status, setStatus] = useState('loading');
  const [query, setQuery] = useState('');
  const [categorySlug, setCategorySlug] = useState('all');

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        setStatus('loading');

        const response = await fetch(API_URL, {
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el catálogo.');
        }

        const data = await response.json();

        if (!mounted) {
          return;
        }

        setCatalog(data);
        setStatus('ready');
      } catch (error) {
        console.error(error);

        if (!mounted) {
          return;
        }

        setStatus('error');
      }
    }

    loadCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = catalog?.categories || [];
  const products = catalog?.products || [];

  const filteredProducts = useMemo(() => {
    const term = normalize(query);

    return products.filter((product) => {
      const matchesCategory = categorySlug === 'all' || product.category?.slug === categorySlug;

      const haystack = normalize([
        product.name,
        product.category?.name,
      ].join(' '));

      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [products, query, categorySlug]);

  if (status === 'loading') {
    return (
      <main className="shell center">
        <div className="loaderCard">
          <div className="spinner" />
          <strong>Cargando catálogo...</strong>
          <span>Estamos consultando los productos disponibles.</span>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="shell center">
        <div className="emptyCard">
          <strong>No pudimos cargar el catálogo</strong>
          <p>Revisa que el endpoint de Laravel esté activo y que VITE_CATALOG_API_URL esté bien configurado.</p>
        </div>
      </main>
    );
  }

  const business = catalog?.business || {};

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <small>Catálogo disponible</small>
          <h1>Productos de belleza disponibles 1</h1>
          <p>Consulta nuestro catálogo actualizado y encuentra productos para tu negocio o uso personal.</p>
        </div>
      </header>

      <section className="filters">
        <input
          type="search"
          placeholder="Buscar producto o categoría..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="chips">
          <button
            type="button"
            className={categorySlug === 'all' ? 'active' : ''}
            onClick={() => setCategorySlug('all')}
          >
            Todo
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={categorySlug === category.slug ? 'active' : ''}
              onClick={() => setCategorySlug(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="count">
        {filteredProducts.length} producto(s) disponible(s)
      </section>

      {filteredProducts.length > 0 ? (
        <section className="grid">
          {filteredProducts.map((product) => (
            <article className="card" key={product.id}>
              <div className="imageWrap">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} loading="lazy" />
                ) : (
                  <div className="imageFallback">Sin imagen</div>
                )}
              </div>

              <div className="cardBody">
                <div className="meta">
                  {product.category?.name || 'Producto'}
                </div>

                <h2>{product.name}</h2>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="emptyCard">
          <strong>No hay productos para esta búsqueda</strong>
          <p>Intenta buscar otra palabra o selecciona otra categoría.</p>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
