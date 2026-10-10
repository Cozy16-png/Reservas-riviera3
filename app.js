let experiencias = [];
let reservas = [];
let categoriaActual = "todas";

const catalogo = document.querySelector("#catalogo");
const contador = document.querySelector("#contador");
const buscador = document.querySelector("#buscador");
const precioMaximo = document.querySelector("#precioMaximo");
const ordenar = document.querySelector("#ordenar");
const filtroCategoria = document.querySelector("#filtroCategoria");
const mensajeVacio = document.querySelector("#mensaje-vacio");
const mensaje = document.querySelector("#mensaje");

const listaReservas = document.querySelector("#listaReservas");
const totalPersonas = document.querySelector("#totalPersonas");
const total = document.querySelector("#total");
const vaciarReservacion = document.querySelector("#vaciarReservacion");
const confirmacionVaciado = document.querySelector("#confirmacionVaciado");
const confirmarVaciado = document.querySelector("#confirmarVaciado");
const cancelarVaciado = document.querySelector("#cancelarVaciado");

function formatoMoneda(importe) {
  return "$" + importe.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MXN";
}

function mostrarMensaje(texto, tipo = "exito") {
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;
}

function limpiarMensaje() {
  mensaje.textContent = "";
  mensaje.className = "mensaje";
}

async function cargarExperiencias() {
  try {
    contador.textContent = "Cargando experiencias...";

    const respuesta = await fetch("./data/experiencias.json");

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar el archivo JSON");
    }

    experiencias = await respuesta.json();
    actualizarCatalogo();
  } catch (error) {
    contador.textContent = "No se pudieron cargar las experiencias.";

    mostrarMensaje(
      "No fue posible cargar los datos. Revisa el archivo experiencias.json y abre la página con Live Server.",
      "error"
    );

    console.error(error);
  }
}

function obtenerResultados() {
  const texto = buscador.value.trim().toLowerCase();
  const entradaPrecio = precioMaximo.value.trim();

  const limite = entradaPrecio === ""
    ? Infinity
    : Number(entradaPrecio);

  if (
    precioMaximo.validity.badInput ||
    (entradaPrecio !== "" && (!Number.isFinite(limite) || limite < 0))
  ) {
    mostrarMensaje(
      "Escribe un precio máximo válido, igual o mayor que cero.",
      "error"
    );

    return [];
  }

  let resultados = experiencias.filter(experiencia => {
    const coincideNombre = experiencia.nombre
      .toLowerCase()
      .includes(texto);

    const coincideCategoria =
      categoriaActual === "todas" ||
      experiencia.categoria === categoriaActual;

    const coincidePrecio = experiencia.precio <= limite;

    return coincideNombre && coincideCategoria && coincidePrecio;
  });

  if (ordenar.value === "ascendente") {
    resultados.sort((a, b) => a.precio - b.precio);
  }

  if (ordenar.value === "descendente") {
    resultados.sort((a, b) => b.precio - a.precio);
  }

  return resultados;
}

function actualizarCatalogo() {
  const resultados = obtenerResultados();

  catalogo.innerHTML = resultados.map(experiencia => `
    <article class="tarjeta">
      <div class="imagen" aria-hidden="true">
        ${experiencia.icono}
      </div>

      <div class="informacion">
        <span class="etiqueta">${experiencia.categoria}</span>
        <h3>${experiencia.nombre}</h3>
        <p>Cupo máximo: ${experiencia.cupo} personas</p>
        <p class="precio">${formatoMoneda(experiencia.precio)}</p>

        <label for="cantidad-${experiencia.id}">
          Personas para ${experiencia.nombre}
        </label>

        <input
          type="number"
          id="cantidad-${experiencia.id}"
          min="1"
          max="${experiencia.cupo}"
          step="1"
          value="1"
        >

        <button
          type="button"
          class="btn-reservar"
          data-id="${experiencia.id}"
        >
          Agregar a mi reservación
        </button>
      </div>
    </article>
  `).join("");

  contador.textContent = `${resultados.length} experiencias encontradas`;

  mensajeVacio.hidden = resultados.length !== 0;

  agregarEventosReservar();
}

function agregarEventosReservar() {
  document.querySelectorAll(".btn-reservar").forEach(boton => {
    boton.addEventListener("click", () => {
      agregarReserva(Number(boton.dataset.id));
    });
  });
}

function agregarReserva(id) {
  const experiencia = experiencias.find(elemento => elemento.id === id);
  const entrada = document.querySelector(`#cantidad-${id}`);
  const cantidad = Number(entrada.value);

  if (!Number.isInteger(cantidad) || cantidad < 1) {
    mostrarMensaje(
      "La cantidad de personas debe ser un número entero mayor que cero.",
      "error"
    );
    return;
  }

  const existente = reservas.find(reserva => reserva.experienciaId === id);
  const cantidadAnterior = existente ? existente.cantidad : 0;
  const nuevaCantidad = cantidadAnterior + cantidad;

  if (nuevaCantidad > experiencia.cupo) {
    mostrarMensaje(
      `El cupo de ${experiencia.nombre} es de ${experiencia.cupo} personas. Ya tienes ${cantidadAnterior} en tu reservación.`,
      "error"
    );
    return;
  }

  if (existente) {
    existente.cantidad = nuevaCantidad;
    existente.subtotal = nuevaCantidad * existente.precio;
  } else {
    reservas.push({
      experienciaId: experiencia.id,
      nombre: experiencia.nombre,
      precio: experiencia.precio,
      cantidad: cantidad,
      subtotal: experiencia.precio * cantidad
    });
  }

  cerrarConfirmacion();
  mostrarReservas();

  mostrarMensaje(
    `Agregaste ${cantidad} persona(s) a ${experiencia.nombre}.`
  );
}

function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
  } else {
    listaReservas.innerHTML = reservas.map(reserva => `
      <article class="item-reserva">
        <div>
          <strong>${reserva.nombre}</strong>
          <p>${formatoMoneda(reserva.precio)} por persona</p>

          <div class="controles-cantidad">
            <button
              type="button"
              data-accion="disminuir"
              data-id="${reserva.experienciaId}"
              aria-label="Disminuir personas en ${reserva.nombre}"
            >
              −
            </button>

            <span class="cantidad-reserva">
              ${reserva.cantidad}
            </span>
            <span>persona(s)</span>

            <button
              type="button"
              data-accion="aumentar"
              data-id="${reserva.experienciaId}"
              aria-label="Aumentar personas en ${reserva.nombre}"
            >
              +
            </button>
          </div>
        </div>

        <div class="detalle-reserva">
          <strong>${formatoMoneda(reserva.subtotal)}</strong>

          <button
            type="button"
            class="btn-eliminar"
            data-accion="eliminar"
            data-id="${reserva.experienciaId}"
            aria-label="Eliminar ${reserva.nombre}"
          >
            Eliminar
          </button>
        </div>
      </article>
    `).join("");
  }

  const personas = reservas.reduce(
    (acumulado, reserva) => acumulado + reserva.cantidad,
    0
  );

  const importe = reservas.reduce(
    (acumulado, reserva) => acumulado + reserva.subtotal,
    0
  );

  totalPersonas.textContent = personas;
  total.textContent = formatoMoneda(importe);
  vaciarReservacion.disabled = reservas.length === 0;
}


function cambiarCantidad(id, cambio) {
  const reserva = reservas.find(elemento => elemento.experienciaId === id);
  const experiencia = experiencias.find(elemento => elemento.id === id);
  const nuevaCantidad = reserva.cantidad + cambio;

  if (nuevaCantidad < 1) {
    mostrarMensaje(
      "La cantidad mínima es una persona. Usa Eliminar para quitar la experiencia.",
      "error"
    );
    return;
  }

  if (nuevaCantidad > experiencia.cupo) {
    mostrarMensaje(
      `El cupo máximo de ${experiencia.nombre} es de ${experiencia.cupo} personas.`,
      "error"
    );
    return;
  }

  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = nuevaCantidad * reserva.precio;

  cerrarConfirmacion();
  mostrarReservas();
  mostrarMensaje(`Actualizaste la cantidad de ${reserva.nombre}.`);
}

function eliminarReserva(id) {
  reservas = reservas.filter(reserva => reserva.experienciaId !== id);

  cerrarConfirmacion();
  mostrarReservas();
  mostrarMensaje("Experiencia eliminada de la reservación.");
}

function cerrarConfirmacion() {
  confirmacionVaciado.hidden = true;
}

filtroCategoria.addEventListener("change", () => {
  categoriaActual = filtroCategoria.value;
  limpiarMensaje();
  actualizarCatalogo();
});

buscador.addEventListener("input", () => {
  limpiarMensaje();
  actualizarCatalogo();
});

precioMaximo.addEventListener("input", () => {
  limpiarMensaje();
  actualizarCatalogo();
});

ordenar.addEventListener("change", () => {
  limpiarMensaje();
  actualizarCatalogo();
});

// Un evento para los botones de Mi reservación
listaReservas.addEventListener("click", evento => {
  const boton = evento.target.closest("button[data-accion]");

  if (!boton) return;

  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === "aumentar") {
    cambiarCantidad(id, 1);
  } else if (accion === "disminuir") {
    cambiarCantidad(id, -1);
  } else if (accion === "eliminar") {
    eliminarReserva(id);
  }
});

vaciarReservacion.addEventListener("click", () => {
  if (reservas.length === 0) return;

  confirmacionVaciado.hidden = false;
  cancelarVaciado.focus();
});

cancelarVaciado.addEventListener("click", () => {
  cerrarConfirmacion();
  vaciarReservacion.focus();
});

confirmarVaciado.addEventListener("click", () => {
  reservas = [];

  cerrarConfirmacion();
  mostrarReservas();
  mostrarMensaje("La reservación se vació.");
  buscador.focus();
});

mostrarReservas();
cargarExperiencias();