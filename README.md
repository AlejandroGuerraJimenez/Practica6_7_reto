---
title: "Sistema Solar Educativo"
author: "Alejandro Guerra Jimenez"
---

# Descripción General

Este proyecto es una **simulación interactiva del Sistema Solar** desarrollada con [Three.js], diseñada con fines educativos y de exploración visual. Permite observar los planetas, lunas y anillos del sistema solar, así como interactuar con ellos mediante diferentes modos de cámara y controles de usuario.

Proyecto original en: https://codesandbox.io/p/sandbox/practica-6-y-7-reto-d98dfq
Video del proyecto: https://youtu.be/eegg_N-NNio
---

# Tabla de Contenidos

1. [Características Principales](#características-principales)
2. [Estructura del Código](#estructura-del-código)
3. [Inicialización de la Escena](#inicialización-de-la-escena)
4. [Cuerpos Celestes](#cuerpos-celestes)
5. [Interacción y Controles](#interacción-y-controles)
6. [Animación y Loop Principal](#animación-y-loop-principal)
7. [Extensibilidad](#extensibilidad)
8. [Recursos y Texturas](#recursos-y-texturas)

---

# Características Principales

## 1. Representación realista del Sistema Solar

- Modela **todos los planetas principales** (Mercurio a Neptuno) con:
  - **Texturas de superficie** que muestran rasgos visuales reales.
  - **Bump maps** para generar relieve (cráteres y montañas visibles).
  - **Mapas de nubes y transparencia** (para la Tierra) creando efectos atmosféricos dinámicos.
- Incluye **principales lunas** (Luna, Fobos, Deimos) y **anillos de Saturno y Urano** con mapas de color y alfa.
- Cada planeta tiene **órbita elíptica** aproximada mediante `EllipseCurve`.

> Esto permite a los usuarios ver las diferencias visuales y orbitales de los planetas.

---

## 2. Modo Libre

- Controles tipo **FPS**:  
  - **WASD** para moverse.  
  - **Mouse** para rotar la cámara.  
- Uso de `PointerLockControls` para inmersión:
  - Bloquea el cursor al hacer clic.  
  - Movimiento relativo a la orientación de la cámara.
  
> Permite explorar el sistema solar como si flotaras entre planetas y estrellas.

---

## 3. Seguir Planeta

- Centra la cámara en un planeta seleccionado:
  - Calcula un **offset** (`followDistance`) para mantener distancia adecuada.  
  - Mouse controla rotación de cámara alrededor del planeta.  
  - Rueda del mouse para acercar o alejar.  
- Selección mediante **raycaster**, detectando incluso sub-objetos como nubes.

> Útil para observar planetas de cerca y estudiar órbitas y características visuales.

---

## 4. Agregar Planetas

- Permite crear planetas en tiempo real:
  - Configuración desde GUI: **radio, velocidad, color**.  
  - Posición calculada usando **plano invisible y raycaster**.  
- Cada planeta:
  - Se añade a `planets[]` y puede integrarse al modo seguir planeta.  
  - Tiene órbita elíptica generada automáticamente.

> Facilita la **experimentación educativa** y entender relación entre tamaño, distancia y velocidad orbital.

---

## 5. Animación parametrizada

- Uso de **ecuaciones paramétricas (cos/sin)** para órbitas.  
- **Planetas**: rotación sobre su eje y nubes girando independientemente.  
- **Lunas**: órbitan usando pivots, con inclinación ajustable.  
- **Anillos**: rotan suavemente sobre eje local para dinamismo visual.

> Permite visualizar movimiento orbital y cómo interaccionan los cuerpos celestes con el tiempo global.

---

## 6. Interfaz de usuario (GUI)

- Implementada con [lil-gui].  
- Permite modificar:
  - Velocidad global del sistema (`globalSpeed`).  
  - Modo de cámara (Libre, Seguir Planeta, Agregar Planetas).  
  - Parámetros para nuevos planetas (radio, velocidad, color).  
- Cambiar de modo actualiza el **estado interno** y muestra instrucciones en pantalla.

> Hace la simulación **interactiva y ajustable** para exploración y aprendizaje.

---

# Estructura del Código

1. **Variables Globales**: contenedores para escena, cámara, renderer, planetas, lunas, anillos y estados de usuario.  
2. **Inicialización (`init`)**: funciones para escena, cámara, renderer, luces, cuerpos celestes, eventos y GUI.  
3. **Cuerpos Celestes**: funciones para crear estrellas, planetas, lunas y anillos.  
4. **Eventos y Controles**: mouse, teclado y raycaster para interacción.  
5. **Loop de Animación (`animate`)**: actualización de posiciones y cámara.  
6. **Funciones Auxiliares**: etiquetas 3D, movimiento de cámara, ajuste de ventana.

---

# Inicialización de la Escena

- **`setupInfo()`**: crea contenedor DOM con instrucciones.  
- **`setupScene()` y `setupBackground()`**: inicializa escena y fondo de estrellas mediante esfera invertida.  
- **`setupCamera()`**: cámara perspectiva con posición inicial.  
- **`setupRenderer()`**: renderer WebGL con tamaño de ventana y pixel ratio.  
- **`setupLights()`**: luces puntual, ambiental y direccional.  
- **`setupControls()`**: PointerLockControls para modo libre.

---

# Cuerpos Celestes

### Estrellas
- **`createStar(radius, color, texture)`**: malla esférica emissiva (ej. Sol).  

### Planetas
- **`createPlanet(...)`**: radio, distancia, velocidad, color/textura, bump, nubes, órbita visual.  
- Se agregan a `planets[]`.  
- Nubes como malla hija que rota independiente.

### Lunas
- **`createMoon(...)`**: órbita mediante pivots, velocidad angular y offset aleatorio.  
- Guardadas en `moons[]`.

### Anillos
- **`createRing(...)`**: recalcula UVs para alphaMap radial.  
- Transparencia (`depthWrite=false`) y rotación ligera.

### Etiquetas
- **`addLabelToBody(body, text)`**: canvas 2D convertido a sprite para mostrar nombre.

---

# Interacción y Controles

- **Raycaster** para detectar clics sobre planetas o plano invisible.  
- **Modos de cámara**: Libre, Seguir Planeta, Agregar Planetas.  
- **Mouse**: arrastre para rotar, rueda para zoom.  
- **Teclado**: WASD para movimiento libre.

---

# Animación y Loop Principal

- **`animate()`**:
  1. Calcula tiempo simulado (`elapsed * globalSpeed`).  
  2. Actualiza planetas: posición, rotación, nubes.  
  3. Actualiza lunas mediante pivots.  
  4. Actualiza anillos.  
  5. Actualiza cámara según modo.  
  6. Renderiza escena.  

- **`updateCameraMovement()`**: aplica movimiento relativo a la orientación de cámara.  
- **`onWindowResize()`**: mantiene relación de aspecto.

---

# Extensibilidad

- Añadir planetas, lunas o anillos nuevos usando `createPlanet` y `createMoon`.  
- Cambiar texturas y parámetros de órbita para simular distintos sistemas planetarios.  
- Integrar UI adicional para información de planetas y escalas reales.

---

# Recursos y Texturas

- Texturas de planetas, lunas, anillos y Sol en `textures/`.  
- Mapas: `map`, `bump`, `spec`, `cloud`, `alpha`.  
- Fondo de estrellas: `textures/milky_way_map.jpg`.

---

# Conclusión

El proyecto combina **visualización 3D**, **interacción en tiempo real** y **educación científica**, ofreciendo una experiencia intuitiva para explorar el Sistema Solar. El código está **comentado y estructurado** para aprendizaje y experimentación en Three.js.


