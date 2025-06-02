// Prefijo que se usará como palabra clave para activar comandos
const ordenPrefijo = "NEXA";
// DEFINICIÓN DEL ENDPOINT PARA LA COMUNICACIÓN CON LA API DE PHP
const API_URL = "http://52.3.227.241/api-gpt-php/endpoints/chat.php";

// Espera a que el contenido del DOM esté completamente cargado antes de ejecutar el script
document.addEventListener("DOMContentLoaded", () => {
  // Obtiene referencias a los elementos del DOM que se usarán
  const startBtn = document.getElementById("startBtn"); // Botón para iniciar reconocimiento
  const outputText = document.getElementById("outputText"); // Elemento para mostrar mensajes
  const msgText = document.getElementById("msgText"); // Elemento para mostrar estado

  // Muestra mensaje inicial indicando cómo empezar
  outputText.innerHTML = `Di ${ordenPrefijo} para ver el mensaje`;

  // Variables para controlar el estado del reconocimiento
  let recognition; // Almacena instancia del reconocimiento de voz
  let stoppedManually = false; // Indica si se detuvo manualmente

  // Verifica si el navegador soporta reconocimiento de voz
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition(); // Crea instancia de reconocimiento
    recognition.continuous = true; // Mantiene el micrófono escuchando continuamente
    recognition.lang = "es-ES"; // Configura el idioma a español
  } else {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return; // Sale si no hay soporte
  }

  // Función que normaliza el texto eliminando acentos y caracteres especiales
  const normalizarTexto = (texto) => {
    // Normaliza el texto y elimina caracteres diacríticos (acentos, etc) 
    // usando normalización NFD y expresión regular para caracteres Unicode
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // FUNCIÓN QUE REALIZA LA COMUNICACIÓN CON LA API
const enviarMensajeAPI = async (mensaje) => {
  try {
    // REALIZA LA PETICIÓN POST AL ENDPOINT DEFINIDO EN API_URL
    const response = await fetch(API_URL, {
      method: 'POST', // Define el método HTTP como POST para enviar datos a la API
      headers: {
        'Content-Type': 'application/json' // Especifica que el cuerpo de la solicitud está en formato JSON
      },
      body: JSON.stringify({ message: mensaje }) // Convierte el mensaje en un objeto JSON y lo envía en el cuerpo de la solicitud
    });

    // Verifica si la respuesta no es exitosa (código de estado diferente de 200-299)
    if (!response.ok) {
      throw new Error('Error en la respuesta de la API'); // Lanza un error si la respuesta de la API no es válida
    }

    const data = await response.json(); // Convierte la respuesta del servidor a formato JSON
    return data.reply; // Retorna la propiedad 'reply' de la respuesta de la API
  } catch (error) {
    console.error('Error al enviar mensaje a la API:', error); // Muestra el error en la consola
    return null; // Retorna null en caso de error
  }
};

  // Configura el evento click del botón que inicia el reconocimiento de voz
  startBtn.addEventListener("click", () => {
    console.log("Botón presionado");
    stoppedManually = false;
    recognition.start();
    startBtn.disabled = true;
    outputText.textContent = `Escuchando... Di ${ordenPrefijo} para interactuar.`;
    msgText.innerHTML = "";
  });

  // Función que configura todos los manejadores de eventos del reconocimiento de voz
  const setupRecognitionListeners = () => {
    // Maneja el evento cuando se detecta voz y se obtiene un resultado
    recognition.onresult = async (event) => {
      // Obtiene la última transcripción del evento de reconocimiento de voz
    let transcript = event.results[event.results.length - 1][0].transcript.trim().toUpperCase(); 
    // Normaliza el texto transcrito utilizando la función 'normalizarTexto'
    const textoNormalizado = normalizarTexto(transcript);

// Imprime en la consola el texto reconocido después de la normalización
console.log("Texto reconocido:", textoNormalizado);


      // Verifica si se dio el comando para salir
      if (textoNormalizado.includes(ordenPrefijo + " SALIR")) {
        stoppedManually = true; // Marca que se detuvo manualmente
        recognition.stop(); // Detiene el reconocimiento
        startBtn.disabled = false; // Habilita el botón de inicio
        outputText.textContent = "Saliendo del modo de escucha.";
        msgText.innerHTML = ""; // Elimina todo el contenido dentro del elemento 'msgText'
        
        // Muestra una alerta de finalización usando SweetAlert2
        Swal.fire({
          title: 'Finalizando', // Título de la alerta
          text: 'Cerrando sesión...', // Texto de la alerta
          icon: 'warning', // Icono de advertencia
          timer: 2000, // Duración de la alerta en milisegundos (2 segundos)
          timerProgressBar: true, // Muestra una barra de progreso del tiempo
          showConfirmButton: false // No muestra el botón de confirmación
        });
        
      } else if (textoNormalizado.includes(ordenPrefijo)) { // Si el texto contiene la palabra clave
        const textoSinPrefijo = normalizarTexto(textoNormalizado.replace(ordenPrefijo, '').trim()); // Elimina el prefijo y normaliza el texto
        let token = ''; // Declara una variable 'token' vacía

        // Identifica el tipo de comando según las palabras clave reconocidas
        // Primero detecta las órdenes compuestas para evitar confusiones
        if ((textoSinPrefijo.includes('VUELTA') || textoSinPrefijo.includes('GIRA')) && (textoSinPrefijo.includes('ADELANTE') || textoSinPrefijo.includes('AVANZ')) && textoSinPrefijo.includes('DERECHA')) {
          token = 'V_ADE_DER';
        } else if ((textoSinPrefijo.includes('VUELTA') || textoSinPrefijo.includes('GIRA')) && (textoSinPrefijo.includes('ADELANTE') || textoSinPrefijo.includes('AVANZ')) && textoSinPrefijo.includes('IZQUIERDA')) {
          token = 'V_ADE_IZQ';
        } else if ((textoSinPrefijo.includes('VUELTA') || textoSinPrefijo.includes('GIRA')) && (textoSinPrefijo.includes('ATRAS') || textoSinPrefijo.includes('RETROCED')) && textoSinPrefijo.includes('DERECHA')) {
          token = 'V_ATR_DER';
        } else if ((textoSinPrefijo.includes('VUELTA') || textoSinPrefijo.includes('GIRA')) && (textoSinPrefijo.includes('ATRAS') || textoSinPrefijo.includes('RETROCED')) && textoSinPrefijo.includes('IZQUIERDA')) {
          token = 'V_ATR_IZQ';
        } else if (textoSinPrefijo.includes('AVANZ') || textoSinPrefijo.includes('ADELANTE')) { 
          token = 'AVANZAR'; // Asigna 'avanzar' si el texto incluye palabras relacionadas con avanzar
        } else if (textoSinPrefijo.includes('RETROCED') || textoSinPrefijo.includes('ATRAS') || 
                   textoSinPrefijo.includes('DIRIGETE HACIA ATRAS') || textoSinPrefijo.includes('DIRIGE HACIA ATRAS')) {
          token = 'RETROCEDER'; // Asigna 'retroceder' si el texto contiene palabras relacionadas con retroceder
        } else if (textoSinPrefijo.includes('DETEN')) {
          token = 'DETENER'; // Asigna 'detener' si el texto contiene 'deten'
        } else if (textoSinPrefijo.includes('DERECHA')) { 
          // Procesa comandos de giro a la derecha con diferentes ángulos
          if (textoSinPrefijo.includes('90')) {
            token = '90° DERECHA'; // Asigna '90° derecha' si el texto contiene '90'
          } else if (textoSinPrefijo.includes('360')) {
            token = '360° DERECHA'; // Asigna '360° derecha' si el texto contiene '360'
          } else {
            token = 'VUELTA DERECHA'; // Asigna 'vuelta derecha' para cualquier otro caso
          }
        } else if (textoSinPrefijo.includes('IZQUIERDA')) {
          // Procesa comandos de giro a la izquierda con diferentes ángulos
          if (textoSinPrefijo.includes('90')) {
            token = '90° IZQUIERDA'; // Asigna '90° izquierda' si el texto contiene '90'
          } else if (textoSinPrefijo.includes('360')) {
            token = '360° IZQUIERDA'; // Asigna '360° izquierda' si el texto contiene '360'
          } else {
            token = 'VUELTA IZQUIERDA'; // Asigna 'vuelta izquierda' para cualquier otro caso
          }
        }
        if (token) {  
          // Verifica si hay un comando válido  
          // Mostrar rápidamente en pantalla la palabra clave detectada
          Swal.fire({
            title: 'Orden detectada',
            text: `Palabra clave: ${token}`,
            icon: 'info',
            timer: 800,
            timerProgressBar: true,
            showConfirmButton: false
          });

          const respuestaAPI = await enviarMensajeAPI(token);  // Envía el token a la API y espera la respuesta  

          outputText.innerHTML = `Token generado: "<strong><em>${token}</em></strong>"`;  // Muestra el token en la interfaz  

          msgText.innerHTML = `Frase reconocida: "${transcript}"<br>Respuesta API: ${respuestaAPI || 'Sin respuesta'}`;  // Muestra la frase reconocida y la respuesta de la API  

          Swal.fire({  
              title: 'Comando Reconocido',    // Título de la alerta  
              text: `Ejecutando: ${token}`,   // Muestra el comando ejecutado  
              icon: 'success',                // Alerta de éxito  
              timer: 1500,                     // Se cierra en 1.5s  
              timerProgressBar: true,          // Barra de progreso  
              showConfirmButton: false         // Sin botón de confirmación  
          }); 
          // Detiene el reconocimiento después de procesar el comando  
              stoppedManually = true;  // Marca que la detención fue manual  
              recognition.stop();  // Cancela el reconocimiento de voz  
              startBtn.disabled = false;  // Habilita el botón de inicio nuevamente  

        } else {
          // Muestra mensaje si el comando no fue reconocido
          outputText.innerHTML = `Comando no reconocido: "${transcript}"`;  // Muestra el mensaje de error con la frase detectada  
          msgText.innerHTML = "Intenta dar una instrucción de movimiento o giro";  // Sugerencia para el usuario sobre los comandos válidos  
        }
      }
    }

    // Maneja los errores que pueden ocurrir durante el reconocimiento
    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        alert("Error: El micrófono no tiene permisos o fue bloqueado.");
      } else if (event.error === "network") {
        alert("Error: Problema de conexión con el servicio de reconocimiento de voz.");
      }
      recognition.stop(); // Detiene el reconocimiento en caso de error
      startBtn.disabled = false; // Habilita el botón de inicio
    }

    // Maneja el evento cuando termina el reconocimiento de voz
    recognition.onend = () => {
      if (!stoppedManually) {
        msgText.innerHTML = "El reconocimiento de voz se detuvo inesperadamente<br>Habla nuevamente para continuar...";
        recognition.start(); // Reinicia el reconocimiento si no se detuvo manualmente
      } else {
        msgText.innerHTML = "El reconocimiento de voz se detuvo.<br>Presiona el botón para comenzar nuevamente.";
        startBtn.disabled = false; // Habilita el botón de inicio
      }
    }
  }

  // Realiza la configuración inicial de los manejadores de eventos
  setupRecognitionListeners();
}); // cierra la función que se ejecuta cuando el DOM está completamente cargado
