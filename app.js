/* =========================================================
   MARYNEL WEB — FASE 1
   app.js
   JavaScript puro — preparado para conectar Firebase después.
   ========================================================= */

"use strict";

/* -----------------------------
   CONFIGURACIÓN
----------------------------- */

const MARYNEL_CONFIG = {
  whatsapp: "50200000000", // Cambiar por el número real de MARYNEL
  currency: "Q",
  storageKey: "marynel_productos_v1"
};

/* -----------------------------
   PRODUCTOS
   En Fase 1 se guardan en el
   navegador mediante localStorage.
   Firebase sustituirá esta parte
   en la siguiente fase.
----------------------------- */

let productos = cargarProductos();

function cargarProductos() {
  try {
    const guardados = localStorage.getItem(MARYNEL_CONFIG.storageKey);
    return guardados ? JSON.parse(guardados) : [];
  } catch (error) {
    console.error("No se pudieron cargar los productos:", error);
    return [];
  }
}

function guardarProductos() {
  localStorage.setItem(
    MARYNEL_CONFIG.storageKey,
    JSON.stringify(productos)
  );
}

/* -----------------------------
   AGREGAR PRODUCTO
----------------------------- */

function agregarProducto(datos) {
  const producto = {
    id: Date.now().toString(),
    nombre: datos.nombre?.trim() || "Producto sin nombre",
    precio: Number(datos.precio) || 0,
    descripcion: datos.descripcion?.trim() || "",
    categoria: datos.categoria?.trim() || "Otros",
    stock: Number(datos.stock) || 0,
    imagen: datos.imagen || "",
    promocion: datos.promocion?.trim() || "",
    disponible: datos.disponible !== false,
    fecha: new Date().toISOString()
  };

  productos.push(producto);
  guardarProductos();
  renderProductos();

  return producto;
}

/* -----------------------------
   EDITAR PRODUCTO
----------------------------- */

function editarProducto(id, nuevosDatos) {
  const indice = productos.findIndex(p => p.id === id);

  if (indice === -1) {
    console.warn("Producto no encontrado:", id);
    return null;
  }

  productos[indice] = {
    ...productos[indice],
    ...nuevosDatos,
    precio: Number(nuevosDatos.precio ?? productos[indice].precio),
    stock: Number(nuevosDatos.stock ?? productos[indice].stock)
  };

  guardarProductos();
  renderProductos();

  return productos[indice];
}

/* -----------------------------
   ELIMINAR PRODUCTO
----------------------------- */

function eliminarProducto(id) {
  const producto = productos.find(p => p.id === id);

  if (!producto) return false;

  const confirmar = confirm(
    `¿Eliminar "${producto.nombre}" del catálogo?`
  );

  if (!confirmar) return false;

  productos = productos.filter(p => p.id !== id);
  guardarProductos();
  renderProductos();

  return true;
}

/* -----------------------------
   BUSCAR PRODUCTOS
----------------------------- */

function buscarProductos(texto) {
  const busqueda = String(texto || "").toLowerCase().trim();

  if (!busqueda) {
    return productos;
  }

  return productos.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda) ||
    producto.descripcion.toLowerCase().includes(busqueda) ||
    producto.categoria.toLowerCase().includes(busqueda)
  );
}

/* -----------------------------
   FILTRAR POR CATEGORÍA
----------------------------- */

function filtrarCategoria(categoria) {
  if (!categoria || categoria === "todos") {
    return productos;
  }

  return productos.filter(
    producto =>
      producto.categoria.toLowerCase() === categoria.toLowerCase()
  );
}

/* -----------------------------
   MOSTRAR PRODUCTOS
   Si existe #lista-productos
   en el HTML, los dibuja ahí.
----------------------------- */

function renderProductos(lista = productos) {
  const contenedor = document.getElementById("lista-productos");

  if (!contenedor) return;

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="marynel-vacio">
        <div style="font-size:36px">🛍️</div>
        <h3>No hay productos todavía</h3>
        <p>Agrega el primer producto desde el administrador.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = lista.map(producto => `
    <article class="marynel-producto" data-id="${escapeHTML(producto.id)}">

      ${
        producto.imagen
          ? `<img src="${escapeHTML(producto.imagen)}"
                  alt="${escapeHTML(producto.nombre)}"
                  loading="lazy">`
          : `<div class="marynel-producto-sin-imagen">📦</div>`
      }

      <div class="marynel-producto-info">

        ${
          producto.promocion
            ? `<span class="marynel-promocion">
                ${escapeHTML(producto.promocion)}
              </span>`
            : ""
        }

        <small>${escapeHTML(producto.categoria)}</small>

        <h3>${escapeHTML(producto.nombre)}</h3>

        <p>${escapeHTML(producto.descripcion)}</p>

        <strong class="marynel-precio">
          ${MARYNEL_CONFIG.currency}${Number(producto.precio).toFixed(2)}
        </strong>

        <div class="marynel-stock">
          ${
            producto.stock > 0
              ? `Disponible · ${producto.stock} unidades`
              : "Agotado"
          }
        </div>

        <div class="marynel-producto-botones">
          <button type="button"
                  onclick="comprarProducto('${escapeHTML(producto.id)}')">
            📲 Comprar
          </button>

          <button type="button"
                  onclick="abrirEdicionProducto('${escapeHTML(producto.id)}')">
            ✏️ Editar
          </button>

          <button type="button"
                  onclick="eliminarProducto('${escapeHTML(producto.id)}')">
            🗑️
          </button>
        </div>

      </div>
    </article>
  `).join("");
}

/* -----------------------------
   WHATSAPP
----------------------------- */

function comprarProducto(id) {
  const producto = productos.find(p => p.id === id);

  if (!producto) return;

  if (producto.stock <= 0) {
    alert("Este producto está agotado.");
    return;
  }

  const mensaje =
    `Hola, quiero información sobre:%0A%0A` +
    `🛍️ ${encodeURIComponent(producto.nombre)}%0A` +
    `💰 ${MARYNEL_CONFIG.currency}${producto.precio}%0A` +
    `📦 Stock: ${producto.stock}`;

  const url =
    `https://wa.me/${MARYNEL_CONFIG.whatsapp}?text=${mensaje}`;

  window.open(url, "_blank");
}

/* -----------------------------
   FORMULARIO ADMINISTRADOR
   Si existe #form-producto,
   automáticamente permite
   agregar productos.
----------------------------- */

function conectarFormularioProducto() {
  const formulario = document.getElementById("form-producto");

  if (!formulario) return;

  formulario.addEventListener("submit", event => {
    event.preventDefault();

    const datos = new FormData(formulario);

    const producto = agregarProducto({
      nombre: datos.get("nombre"),
      precio: datos.get("precio"),
      descripcion: datos.get("descripcion"),
      categoria: datos.get("categoria"),
      stock: datos.get("stock"),
      imagen: datos.get("imagen"),
      promocion: datos.get("promocion"),
      disponible: true
    });

    formulario.reset();

    alert(`Producto "${producto.nombre}" agregado correctamente. ✅`);
  });
}

/* -----------------------------
   BUSCADOR AUTOMÁTICO
   Si existe #buscador
----------------------------- */

function conectarBuscador() {
  const buscador = document.getElementById("buscador");

  if (!buscador) return;

  buscador.addEventListener("input", event => {
    const resultados = buscarProductos(event.target.value);
    renderProductos(resultados);
  });
}

/* -----------------------------
   FILTROS DE CATEGORÍA
   Botones con:
   data-categoria="Tecnología"
----------------------------- */

function conectarFiltros() {
  const filtros = document.querySelectorAll("[data-categoria]");

  filtros.forEach(filtro => {
    filtro.addEventListener("click", () => {
      const categoria = filtro.dataset.categoria;
      renderProductos(filtrarCategoria(categoria));
    });
  });
}

/* -----------------------------
   EDICIÓN RÁPIDA
   Abre prompts sencillos en Fase 1.
   Después podremos reemplazarlos
   por un panel administrativo bonito.
----------------------------- */

function abrirEdicionProducto(id) {
  const producto = productos.find(p => p.id === id);

  if (!producto) return;

  const nombre = prompt("Nombre del producto:", producto.nombre);
  if (nombre === null) return;

  const precio = prompt("Precio:", producto.precio);
  if (precio === null) return;

  const stock = prompt("Stock:", producto.stock);
  if (stock === null) return;

  editarProducto(id, {
    nombre,
    precio,
    stock
  });

  alert("Producto actualizado. ✅");
}

/* -----------------------------
   CONTADOR DE PRODUCTOS
   Si existe #contador-productos
----------------------------- */

function actualizarContador() {
  const contador = document.getElementById("contador-productos");

  if (!contador) return;

  contador.textContent = productos.length;
}

/* -----------------------------
   LIMPIAR CATÁLOGO
   Útil solamente durante pruebas.
----------------------------- */

function limpiarCatalogoPrueba() {
  const confirmar = confirm(
    "Esto eliminará todos los productos guardados en este navegador. ¿Continuar?"
  );

  if (!confirmar) return;

  productos = [];
  guardarProductos();
  renderProductos();
  actualizarContador();
}

/* -----------------------------
   SEGURIDAD BÁSICA PARA TEXTO
----------------------------- */

function escapeHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -----------------------------
   INICIO
----------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  conectarFormularioProducto();
  conectarBuscador();
  conectarFiltros();
  renderProductos();
  actualizarContador();

  console.log("MARYNEL Web Fase 1 iniciada correctamente. 🚀");
});

/* =========================================================
   FUTURA CONEXIÓN FIREBASE

   En la Fase 2 sustituiremos:
   - cargarProductos()
   - guardarProductos()
   - agregarProducto()
   - editarProducto()
   - eliminarProducto()

   por Firebase Firestore + Firebase Storage.

   Así los productos dejarán de estar guardados solamente
   en el teléfono y pasarán a estar disponibles para todos
   los visitantes de la página.
   ========================================================= */
