import { test, expect } from '@playwright/test';

test.describe('Casi Nuevo - Public Storefront E2E Tests', () => {
  // Mock data for the products table
  const mockProducts = [
    {
      id: 'e008d519-74d3-4a65-8b01-381c1c73a4b9',
      titulo: 'Sofá de Tres Puestos',
      descripcion: 'Sofá gris muy cómodo, estructura de madera inmunizada.',
      precio: 950000,
      categoria: 'Muebles',
      url_imagen_cloudinary: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400',
      estado_disponibilidad: 'disponible',
      created_at: '2026-07-12T19:30:00.000Z'
    },
    {
      id: '33bead5f-3310-4f51-b847-ec44a3a60424',
      titulo: 'Licuadora Oster Reversible',
      descripcion: 'Licuadora en vidrio templado, motor de alta potencia.',
      precio: 180000,
      categoria: 'Cocina',
      url_imagen_cloudinary: null,
      estado_disponibilidad: 'disponible',
      created_at: '2026-07-12T19:35:00.000Z'
    }
  ];

  test.beforeEach(async ({ page }) => {
    // Intercept Supabase API calls to products and return mock data
    await page.route('**/rest/v1/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProducts),
      });
    });

    // Clear session storage to avoid cache hits between tests
    await page.addInitScript(() => {
      window.sessionStorage.clear();
    });

    await page.goto('/');
  });

  test('should display the main layout and Hero banner', async ({ page }) => {
    // Verify header title
    await expect(page.getByRole('link', { name: /Casi Nuevo/i })).toBeVisible();

    // Verify main Hero heading
    await expect(page.getByRole('heading', { name: /¡Gran Venta de Garaje!/i })).toBeVisible();
    await expect(page.getByText(/apartamento/i).first()).toBeVisible();
  });

  test('should load and display mock products in the grid', async ({ page }) => {
    // Wait for the grid to render
    const cardTitle = page.getByRole('heading', { name: 'Sofá de Tres Puestos' });
    await expect(cardTitle).toBeVisible();

    const priceText = page.getByText('$ 950.000');
    await expect(priceText).toBeVisible();
  });

  test('should filter products by search input', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByRole('heading', { name: 'Sofá de Tres Puestos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Licuadora Oster Reversible' })).toBeVisible();

    // Search for "Oster"
    const searchInput = page.getByPlaceholder(/Buscar muebles, electrodomésticos.../i);
    await searchInput.fill('Oster');

    // "Sofá" should disappear, "Licuadora" should stay
    await expect(page.getByRole('heading', { name: 'Sofá de Tres Puestos' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Licuadora Oster Reversible' })).toBeVisible();
  });

  test('should filter products by category filter buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sofá de Tres Puestos' })).toBeVisible();

    // Click "Cocina" category button
    const cocinaFilterBtn = page.getByRole('button', { name: 'Cocina', exact: true });
    await cocinaFilterBtn.click();

    // Only "Licuadora" should be visible
    await expect(page.getByRole('heading', { name: 'Sofá de Tres Puestos' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Licuadora Oster Reversible' })).toBeVisible();
  });

  test('should format WhatsApp buttons correctly', async ({ page }) => {
    const card = page.locator('div.group').first();
    await expect(card).toBeVisible();

    // Select the "Pedir Información" link inside the first card
    const infoLink = card.getByRole('link', { name: /Pedir Información/i });
    const infoHref = await infoLink.getAttribute('href');
    expect(infoHref).toContain('wa.me/573027271230');
    expect(infoHref).toContain(encodeURIComponent('Hola, me interesa el producto "Sofá de Tres Puestos".'));

    // Select the "Comprar ahora - Tarjeta" link inside the first card
    const payLink = card.getByRole('link', { name: /Comprar ahora - Tarjeta/i });
    const payHref = await payLink.getAttribute('href');
    expect(payHref).toContain('wa.me/573027271230');
    expect(payHref).toContain(encodeURIComponent('Hola, quiero pagar el "Sofá de Tres Puestos" con tarjeta. Solicito el link de pago.'));
  });
});
