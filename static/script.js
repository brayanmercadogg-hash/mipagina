// ==========================================
// ESTADO GLOBAL DEL CARRITO (localStorage)
// ==========================================
let carrito = JSON.parse(localStorage.getItem('burger_carrito')) || [];

let productos = [];
const menuGrid = document.getElementById("menuGrid");
const filterButtons = document.querySelectorAll(".filter-btn");

// ==========================================
// INICIALIZACIÓN GLOBAL (DOM Ready)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
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

    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.innerText = totalProductos;
        cartBadge.style.display = totalProductos > 0 ? 'block' : 'none';
    }

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
                        <p>${item.cantidad}x - $${(item.precio * item.cantidad).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</p>
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
        contenedorTotal.innerText = `$${precioTotal.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
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
        mensaje += `▪️ *${item.cantidad}x* ${item.nombre} \n    Subtotal: $${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0 })}\n`;
    });

    mensaje += `----------------------------------------\n`;
    mensaje += `💰 *TOTAL A PAGAR:* $${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}\n`;

    window.open(`https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// Exposición global para que no fallen los botones dinámicos del HTML
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
// ASYNC FETCH DESDE GOOGLE SHEETS (Base de datos)
// ==========================================
async function cargarMenu() {
    try {
        // Tu ID de Google Sheets ya configurado para Burger & Co.
        const SHEET_ID = '1E9ZEMDOYURlVjaGv2RLUha-6xwYJDhbr5e0tONU0Q_0';
        
        // URL para descargar el contenido en formato CSV estructurado
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error al conectar con Google Sheets: ${response.status}`);
        
        const dataText = await response.text();
        
        // Convertimos el texto CSV a un Array de objetos de JavaScript
        productos = interpretarCSV(dataText);
        
        renderizarProductos(productos);
    } catch (error) {
        console.error("Error cargando el menú desde la base de datos:", error);
    }
}

// Función auxiliar para procesar los datos que envía Google Sheets
function interpretarCSV(texto) {
    const lineas = texto.split('\n');
    if (lineas.length === 0 || !lineas[0]) return [];

    // Extraemos las cabeceras limpias de comillas
    const cabeceras = lineas[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const resultado = [];
    
    for (let i = 1; i < lineas.length; i++) {
        if (!lineas[i].trim()) continue;
        
        // Expresión regular avanzada para separar por comas respetando textos con comillas y espacios
        const celdas = lineas[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const filaObjeto = {};
        
        cabeceras.forEach((cabecera, índice) => {
            let valor = celdas[índice] ? celdas[índice].replace(/"/g, '').trim() : '';
            
            // Convertimos automáticamente los ID y precios a números para las operaciones aritméticas
            if (cabecera === 'precio' || cabecera === 'id') {
                valor = parseFloat(valor) || 0;
            }
            filaObjeto[cabecera] = valor;
        });
        
        resultado.push(filaObjeto);
    }
    return resultado;
}

// ==========================================
// RENDER PRODUCTOS
// ==========================================
function renderizarProductos(lista){
    if(!menuGrid) return;
    menuGrid.innerHTML = "";

    lista.forEach(producto => {
        let rutaImagen = producto.imagen;

        // Maneja los espacios codificándolos para la web automáticamente (%20)
        if (!rutaImagen.startsWith('http')) {
            rutaImagen = encodeURI(rutaImagen);
            if (window.location.pathname.includes('/templates/') && !rutaImagen.startsWith('..')) {
                rutaImagen = "../" + rutaImagen;
            }
        }

        menuGrid.innerHTML += `
            <div class="menu-card">
                <div class="card-img">
                    <img src="${rutaImagen}" alt="${producto.nombre}" loading="lazy">
                </div>
                <div class="card-info">
                    <span class="category">${producto.categoria}</span>
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion}</p>
                    <div class="card-footer">
                        <span class="price">$${producto.precio.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
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
// FILTROS Y CONTROLES DEL CARRITO
// ==========================================
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const categoriaFiltrada = button.dataset.category.toLowerCase();
        if(categoriaFiltrada === "todos"){
            renderizarProductos(productos);
        } else {
            const filtrados = productos.filter(p => p.categoria.toLowerCase() === categoriaFiltrada);
            renderizarProductos(filtrados);
        }
    });
});

const cartToggle = document.getElementById('cart-toggle');
const cartClose = document.getElementById('cart-close');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');

const abrirCarrito = (e) => {
    if(e) e.preventDefault(); 
    if(cartSidebar) cartSidebar.classList.add('open');
    if(cartOverlay) cartOverlay.classList.add('open');
};

const cerrarCarrito = () => {
    if(cartSidebar) cartSidebar.classList.remove('open');
    if(cartOverlay) cartOverlay.classList.remove('open');
};

if (cartToggle) cartToggle.addEventListener('click', abrirCarrito);
if (cartClose) cartClose.addEventListener('click', cerrarCarrito);
if (cartOverlay) cartOverlay.addEventListener('click', cerrarCarrito);

document.addEventListener("click", (e) => {
    const esBotonCarrito = e.target.closest('#cart-toggle') || e.target.closest('.cart-nav-link');
    if (esBotonCarrito) {
        abrirCarrito(e);
    }
});
