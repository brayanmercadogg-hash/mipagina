// ==========================================
// ESTADO GLOBAL DEL CARRITO (localStorage)
// ==========================================
let carrito = JSON.parse(localStorage.getItem('burger_carrito')) || [];

// Variables del menú
let productos = [];
const menuGrid = document.getElementById("menuGrid");
const filterButtons = document.querySelectorAll(".filter-btn");

// ==========================================
// INICIALIZACIÓN GLOBAL (DOM Ready)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- CAPTURAR CLICS EN BOTÓN "+" DEL MENÚ ---
    if (menuGrid) {
        menuGrid.addEventListener('click', (e) => {
            const botonAdd = e.target.closest('.btn-add');
            if (botonAdd) {
                const id = botonAdd.dataset.id;
                const nombre = botonAdd.dataset.nombre;
                const precio = parseFloat(botonAdd.dataset.precio);
                
                agregarAlCarrito(id, nombre, precio);
            }
        });
    }

    // --- INICIAR COMPONENTES ---
    cargarMenu();
    actualizarInterfazCarrito();
    if(document.querySelectorAll(".review").length > 0) {
        showReview();
        setInterval(showReview, 3000);
    }
});

// ==========================================
// LÓGICA DEL CARRITO DE COMPRAS
// ==========================================
function agregarAlCarrito(id, nombre, precio) {
    const productoExistente = carrito.find(item => item.id === id);

    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }

    guardarCarrito();
    actualizarInterfazCarrito();
}

function guardarCarrito() {
    localStorage.setItem('burger_carrito', JSON.stringify(carrito));
}

function actualizarInterfazCarrito() {
    const totalProductos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const precioTotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Actualizar burbuja de la Navbar
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.innerText = totalProductos;
        cartBadge.style.display = totalProductos > 0 ? 'block' : 'none';
    }

    // Renderizar lista en la barra lateral
    const contenedorItems = document.getElementById('carrito-items');
    const contenedorTotal = document.getElementById('carrito-total');

    if (contenedorItems) {
        if (carrito.length === 0) {
            contenedorItems.innerHTML = '<p class="cart-empty">Tu carrito está vacío 🌟</p>';
        } else {
            contenedorItems.innerHTML = carrito.map(item => `
                <div class="cart-item">
                    <div class="item-info">
                        <h4>${item.nombre}</h4>
                        <p>${item.cantidad}x - $${(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                    <div class="item-actions">
                        <button onclick="window.cambiarCantidad('${item.id}', -1)">-</button>
                        <span>${item.cantidad}</span>
                        <button onclick="window.cambiarCantidad('${item.id}', 1)">+</button>
                    </div>
                </div>
            `).join('');
        }
    }

    if (contenedorTotal) {
        contenedorTotal.innerText = `$${precioTotal.toFixed(2)}`;
    }
}

function cambiarCantidad(id, cambio) {
    const producto = carrito.find(item => item.id === id);
    if (!producto) return;

    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        carrito = carrito.filter(item => item.id !== id);
    }

    guardarCarrito();
    actualizarInterfazCarrito();
}

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    actualizarInterfazCarrito();
}

function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío. ¡Añade algo del menú! 🍔");
        return;
    }

    let numeroTelefono = "573000000000"; 
    let mensaje = `🍔 *NUEVO PEDIDO - BURGER & CO* 🍔\n\n`;
    let total = 0;
    
    carrito.forEach(item => {
        let subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `▪️ *${item.cantidad}x* ${item.nombre} \n    Subtotal: $${subtotal.toFixed(2)}\n`;
    });
    
    mensaje += `----------------------------------------\n`;
    mensaje += `💰 *TOTAL A PAGAR:* $${total.toFixed(2)}\n`;

    window.open(`https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// Exposición global para que no fallen tus botones del carrito
window.cambiarCantidad = cambiarCantidad;
window.vaciarCarrito = vaciarCarrito;
window.enviarPedidoWhatsApp = enviarPedidoWhatsApp;

// ==========================================
// REVIEWS SLIDER
// ==========================================
let index = 0;
function showReview() {
    const reviews = document.querySelectorAll(".review");
    if(reviews.length === 0) return;
    reviews.forEach(r => r.classList.remove("active"));
    reviews[index].classList.add("active");
    index = (index + 1) % reviews.length;
}

// ==========================================
// ASYNC FETCH JSON (Ruta de Flask garantizada)
// ==========================================
async function cargarMenu(){
    try {
        const response = await fetch("/static/menu.json"); 
        productos = await response.json();
        renderizarProductos(productos);
    } catch(error) {
        console.error("Error cargando menu.json:", error);
    }
}

// ==========================================
// RENDER PRODUCTOS
// ==========================================
function renderizarProductos(lista){
    if(!menuGrid) return;
    menuGrid.innerHTML = "";

    lista.forEach(producto => {
        menuGrid.innerHTML += `
            <div class="menu-card">
                <div class="card-img">
                    <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
                </div>
                <div class="card-info">
                    <span class="category">${producto.categoria}</span>
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion}</p>
                    <div class="card-footer">
                        <span class="price">$${producto.precio}</span>
                        <button class="btn-add" 
                                data-id="${producto.id}" 
                                data-nombre="${producto.nombre}" 
                                data-precio="${producto.precio}">
                            +
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// ==========================================
// FILTRAR CATEGORÍAS
// ==========================
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const categoria = button.dataset.category;
        if(categoria === "todos"){
            renderizarProductos(productos);
        } else {
            const filtrados = productos.filter(producto => producto.categoria === categoria);
            renderizarProductos(filtrados);
        }
    });
});

// --- FORM CONTACTO ---
const form = document.getElementById("form");
if(form){
    form.addEventListener("submit", e => {
        e.preventDefault();
        alert("Mensaje enviado 🍔🔥");
    });
}

// --- CONTROLES VISUALES DEL CARRITO (ABRIR/CERRAR) ---
const cartToggle = document.getElementById('cart-toggle');
const cartClose = document.getElementById('cart-close');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');

if (cartToggle && cartSidebar && cartOverlay) {
    cartToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Evita saltos extraños en la pantalla al pulsar '#'
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
    });
}

const cerrarCarrito = () => {
    if(cartSidebar) cartSidebar.classList.remove('open');
    if(cartOverlay) cartOverlay.classList.remove('open');
};

if (cartClose) cartClose.addEventListener('click', cerrarCarrito);
if (cartOverlay) cartOverlay.addEventListener('click', cerrarCarrito);
// ==========================================
// DETECTOR DE EMERGENCIA PARA ABRIR EL CARRITO
// ==========================================
document.addEventListener("click", (e) => {
    // Buscamos si el clic se hizo en el botón del carrito (por ID o por clase)
    const esBotonCarrito = e.target.closest('#cart-toggle') || e.target.closest('.cart-nav-link');
    
    if (esBotonCarrito) {
        e.preventDefault(); // Evitamos que la página salte
        
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('open');
            overlay.classList.add('open');
        }
    }
});