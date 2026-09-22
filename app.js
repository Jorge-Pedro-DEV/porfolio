
// BASE DE DADOS INICIAL 
const DEFAULT_PRODUCTS = [
    { id: '1', code: 'BM-101', name: 'Patilha de Freio Dianteiro Bros 160', category: 'Freios', price: 35.00, stock: 20, image: ''},
    { id: '2', code: 'BM-102', name: 'Kit Relação Transmissão KMC Bros 160', category: 'Transmissão', price: 145.00, stock: 10, image: ''},
    { id: '3', code: 'BM-103', name: 'Óleo Havoline 20w50 Mineral (1L)', category: 'Motor', price: 30.00, stock: 50, image: ''},
    { id: '4', code: 'BM-104', name: 'Pneu Dianteiro Levorin 90/90-19', category: 'Pneus', price: 210.00, stock: 6, image: ''},
    { id: '5', code: 'BM-105', name: 'Vela de Ignição NK CPR8EA-9', category: 'Elétrica', price: 28.00, stock: 25, image: ''},
];

let products = JSON.parse(localStorage.getItem('bessa_products')) || DEFAULT_PRODUCTS;
let cart = [];
let sales = JSON.parse(localStorage.getItem('bessa_sales')) || [];
let currentPage = 1;
const ITEMS_PER_PAGE = 8;
let isAdminLoggeIn = false;

function saveState() {
    localStorage.setItem('bessa_products', JSON.stringify(products));
    localStorage.setItem('bessa_sales', JSON.stringify(sales));
}

function formatBRL(value) {
    return new Intl.NumberFormat('pt_BR', { style: 'currency', currency: 'BRL'}).format(value);
}

document.addEventListener('DOMContentLoaded', () => {
// NAVEGAÇÃO DE TELA
const navCatalogBtn = document.getElementById('nav-catalog-bnt');
const navCartBtn = document.getElementById('nav-cart-bnt');
const navAdminBtn = document.getElementById('nav-admin-bnt');

function switchView(target) {
    [document.getElementById('section-catalog'), document.getElementById('section-cart'), document.getElementById('section-admin')].forEach(section => section.classList.remove('active'));
    [navCatalogBtn, navCartBtn, navAdminBtn].forEach(btn => btn.classList.remove('active'));

    if (target === 'catalog') {
        document.getElementById('section-catalog').classList.add('active');
        navCatalogBtn.classList.add('active');
        renderCatalog();
    } else if (target === 'cart') {
        document.getElementById('section-cart').classList.add('active');
        navCartBtn.classList.add('active');
        renderCart();
    } else if (target === 'admin') {
        document.getElementById('section-admin').classList.add('active');
        navAdminBtn.classList.add('active');
    }
}

  if (navCatalogBtn) navCatalogBtn.addEventListener('click', () => switchView('catalog'));
  if (navCartBtn) navCartBtn.addEventListener('click', () => switchView('cart'));
  if(navAdminBtn) navAdminBtn.addEventListener('click', () => switchView('admin'));

// RENDERIZAÇÃO DO CATÁLOGO E PAGINAÇÃO
const productGrid = document.getElementById('product-grid');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('cateory-filter');

function renderCatalog() {
    const query = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
        const matchesCat = category === 'TODAS' || p.category === category;
        return matchesSearch && matchesCat;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

    productGrid.innerHTML ='';

    if (paginated.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#aaa;">Nenhuma peça encontrada.</p>';
        document.getElementById(`page-indicator`).textContent = 'Página 0 de 0';
        return;
    }

    paginated.forEach(p => {
        const defaultImage = 'https://via.placeholder.com/230x150/121212/FFFFFF?text=Bessa+MOTOPE%C3%87AS';
        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image || defaultImage}" alt="${p.name}" class="product-img">
            <div class="product-body">
                <span class="product-code">Cód: ${p.code}</span>
                <h3 class="product-title">${p.name}</h3>
                <p class="product-price">${formatBRL(p.price)}</p>
                <p style="font-size:0.8rem; color:#aaa;margin-bottom:10px;">Estoque: ${p.stock} un.</p>
                <button class="btn btn-primary" onclick="addToCart('${p.id}')" ${p.stock <= 0 ? 'disabled' : ''}>
                    ${p.stock > 0 ? 'Adicionar' : 'Sem Estoque'}
                    </button>
            </div>
        `;
        productGrid.appendChild(card);
    });

    document.getElementById('page-indicator').textContent = `Página ${currentPage} de ${totalPages}`;
}

searchInput.addEventListener('input', () => { currentPage = 1; renderCatalog(); });
categoryFilter.addEventListener('change', () => { currentPage = 1; renderCatalog(); });
document.getElementById('prev-page-btn').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderCatalog(); } });
document.getElementById('next-page-btn').addEventListener('click', () => { currentPage++; renderCatalog(); });

// CARRINHO & CHECKOUT
function addToCart(id) {
    const prod = products.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    const item = cart.find(i => i.id === id);
    if (item) {
        if (item.qty < prod.stock) item.qty++;
         else alert('Limite de estoue atingido.');
        } else {
            cart.push({ id: prod.id, code: prod.code, name: prod.name, price: prod.price, qty: 1 });  
    }

    document.getElementById('cart-count').textContent = cart.reduce((acc,i)  => acc + i.qty, 0);
    alert(`${prod.name} adicionado ao carrinho!`);
}

function renderCart() {
    const tbody = document.getElementById('cart-table-body');
    const emptyMsg = document.getElementById('cart-empty-msg');
    tbody.innerHTML = '';
    let total = 0;

    if (cart.length ===0) {
        emptyMsg.classList.remove('hidden');
        document.getElementById('cart-total-value').textContent = formatBRL(0);
        return;
    }

    emptyMsg.classList.add('hidden');
    cart.forEach(item => {
        const sub = item.price * item.qty;
        total += sub;
        const row = document.createElement('tr');
        row.innerHTML = `
        <td><strong>${item.name}</strong><br><small>${item.code}</small></td>
        <td>${formatBRL(item.price)}</td>
        <td>${item.qty}</td>
        <td>${formatBRL(sub)}</td>
                <td><button class="btn btn-secondary" onclick="removeFromCart('${item.id}')">X</button></td>
        `;
                tbody.appendChild(row);
        });

        document.getElementById('cart-total-value').textContent = formatBRL(total);
}


function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    document.getElementById('cart-count').textContent = cart.reduce((acc, i) => acc + i.qty, 0);
    renderCart();
}

document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) return alert('Carrinho vazio.');

    const method = document.getElementById('payment-method').value;
    const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

// Dar baixa no estoque
    cart.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        if (prod) prod.stock -= item.qty;
    });

    const sale = { id: Date.now(), date: new Date().toLocaleString('pt-BR'), total, method, items: [...cart] };
    sales.push(sale);
    saveState();

    // Exibir Fatura 
    document.getElementById('invoice-meta-info').textContent = `Data: ${sale.date} | Pedido #${sale.id}`;
    let html = `<p><strong>Pagamento:</strong> ${method}</p><table style="width:100%; border-collapse:collapse;">`;
        cart.forEach(i => {
            html += `<tr><td>${i.name} (${i.qty}x)</td><td style="text-align:right;">${formatBRL(i.price * i.qty)}</td></tr>`;
        });
        html += `</table><h3 style="text-align:right; margin-top:10px;">TOTAL: ${formatBRL(total)}</h3>`;

        document.getElementById('invoice-items-content').innerHTML = html;
        document.getElementById('invoice-receipt').classList.remove('hidden');

        cart = [];
        renderCart();
        alert('Venda registrada com sucesso!');
    });
    
    document.getElementById('print-invoice-btn').addEventListener('click', () => window.print());

// LOGIN DA ÁREA RESTRITA E VISIBILIDADE DE SENHA
function togglePassVisibility() {
    const input = document.getElementById('admin-pass-input');
    input.type = input.type === 'password' ? 'text' : 'password';
}
        document.getElementById('admin-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
        const pass = document.getElementById('admin-pass-input').value;

            if (pass === 'bessa2026' || pass === 'admin123') {
                isAdminLoggeIn = true;
                document.getElementById('admin-login-form').classList.add('hidden');
                document.getElementById('admin-panel').classList.remove('hidden');
                renderInventory();
                renderStats();
            } else {
                document.getElementById('login-error-ms').classList.remove('hidden');
            }
        });

            document.getElementById('adim-logout-btn').addEventListener('click', () => {
                isAdminLoggeIn = false;
                document.getElementById('admin-panel').classList.add('hidden');
                document.getElementById('admin-login-form').classList.remove('hidden');
                document.getElementById('admin-pass-input').value = '';
            });

            //  GERENCIAMENTO DE PRODUTOS
            const productForm = document.getElementById('product-manage-form');
            let currentImageBase64 = '';

            document.getElementById('prod-image').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        currentImageBase64 = evt.target.result;
                        const preview = document.getElementById('image-preview');
                        preview.src = currentImageBase64;
                        preview.classList.remove('hidden');
                    };
                    reader.readAsDataURL(file);
                }
            });

            productForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const id = document.getElementById('prod-id').value || Date.now().toString();
                const code = document.getElementById('prod-code').value.toUpperCase();
                const name = document.getElementById('prod-name').value;
                const category = document.getElementById('prod-category').value;
                const price = parseFloat(document.getElementById('prod-price').value);
                const stock = parseInt(document.getElementById('prod-stock').value);

                const idx = products.findIndex(p => p.id === id);
                if (idx >= 0) {
                    products[idx] = { ...products[idx], code, name, category, price, stock, image: currentImageBase64 || products[idx].image};
                } else {
                    products.push({id, code, name, category, price, stock, image: currentImageBase64});
                }
                
                saveState();
                resetAdminForm();
                renderInventory();
                renderCatalog();
                alert('Produto salvo com sucesso!');
            });

            function editProd(id) {
                const p = products.find(prod => prod.id ===id);
                if (!p) return;

                document.getElementById('prod-id').value = p.id;
                document.getElementById('prod-code').value = p.code;
                document.getElementById('prod-name').value = p.name;
                document.getElementById('prod-category').value = p.category;
                document.getElementById('prod-price').value = p.price;
                document.getElementById('prod-stock').value = p.stock;

                if (p.image) {
                    const preview = document.getElementById('image-preview');
                    preview.classList.remove('hidden');
                }

                document.getElementById('cancel-edit-btn').classList.remove('hidden');
            }
            
                function deleteProd(id) {
                    if (confirm('Deseja excluir este item?')) {
                        products = products.filter(p => p.id !== id);
                        saveState();
                        renderInventory();
                        renderCatalog();
                    }
                }

                function resetAdminForm() {
                    productForm.reset();
                    document.getElementById('prod-id').value = '';
                    currentImageBase64 = '';
                    document.getElementById('image-preview').classList.add('hidden');
                    document.getElementById('cancel-edit-btn').classList.add('hidden');
                }

                document.getElementById('cancel-edit-btn').addEventListener('click', resetAdminForm);

                function renderInventory() {
                    const tbody = document.getElementById('admin-invictory-table');
                    tbody.innerHTML = '';

                    products.forEach(p => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${p.code}</td>
                            <td><img src="${p.image || 'https://via.placeholder.com/40'}" style="width:35px; height:35px; object-fit:cover; border-radius: 3px;"></td>
                            <td><strong>${p.name}</strong></td>
                            <td>${p.category}</td>
                            <td>${formatBRL(p.price)}</td>
                            <td>${p.stock} un.</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }

                function renderStats() {
                    const total = sales.reduce((acc, s) => acc + s.total, 0);
                    document.getElementById('total-revenue-stat').textContent = formatBRL(total);
                    document.getElementById('total-sale-count').textContent = sales.length;
                }

                // INICIALIZAR
                renderCatalog();
});