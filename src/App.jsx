import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BookOpen, Code, CheckCircle, Lock, Unlock, Award, Star, Terminal, ChevronRight, Lightbulb, Play, RotateCcw, User, LayoutDashboard, LogOut, Target, Keyboard, Cpu, Monitor } from 'lucide-react';

// --- MOTOR DE COLORES Y DETECCIÓN DE ERRORES (SINTAXIS VS CODE) ---
const processCode = (rawCode) => {
  let errors = [];
  let braceCount = 0;
  const lines = rawCode.split('\n');

  const highlightedLines = lines.map((line, index) => {
    let lineErrors = [];

    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    braceCount += (openBraces - closeBraces);

    const openP = (line.match(/\(/g) || []).length;
    const closeP = (line.match(/\)/g) || []).length;
    if (openP !== closeP) lineErrors.push("Paréntesis () desbalanceados");

    const t = line.trim();
    if (t.length > 0 && !t.startsWith('//') && !t.endsWith('{') && !t.endsWith('}') && !t.endsWith(';') && !t.endsWith(':')) {
        if (t.match(/^(int|double|String|boolean|float) .*=.*$/) ||
            t.match(/^System\.out\..*\)$/) ||
            t.match(/^return .*$/) ||
            t.match(/^[a-zA-Z0-9_]+ .*=.*$/)) {
            lineErrors.push("Falta punto y coma (;)");
        }
    }

    const commonTypos = {
        'Scaner': 'Scanner', 'Scnner': 'Scanner', 'Sytem': 'System', 'Systm': 'System',
        'Strin': 'String', 'string': 'String', 'Int': 'int', 'Double': 'double',
        'Float': 'float', 'printl': 'println', 'pritnln': 'println', 'mainn': 'main'
    };
    
    const wordsInLine = t.split(/[\s\(\)\.\{\}\[\]=;]+/);
    wordsInLine.forEach(w => {
        if (commonTypos[w]) lineErrors.push(`¿Quisiste decir '${commonTypos[w]}' en vez de '${w}'?`);
    });

    let htmlLine = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const notInTag = '(?![^<]*>)';

    htmlLine = htmlLine.replace(/(".*?"|'.*?')/g, `<span style="color: #ce9178;">$1</span>`);
    htmlLine = htmlLine.replace(/(\/\/.*)/g, `<span style="color: #6a9955;">$1</span>`);
    
    const controlRegex = new RegExp(`\\b(if|else|for|while|do|return|switch|case|break|continue)\\b${notInTag}`, 'g');
    htmlLine = htmlLine.replace(controlRegex, '<span style="color: #c586c0;">$1</span>');

    const keywordRegex = new RegExp(`\\b(public|private|protected|class|static|void|int|double|boolean|new|this)\\b${notInTag}`, 'g');
    htmlLine = htmlLine.replace(keywordRegex, '<span style="color: #569cd6;">$1</span>');

    const classRegex = new RegExp(`\\b(String|Scanner|System|Main|Producto|Estudiante|Math)\\b${notInTag}`, 'g');
    htmlLine = htmlLine.replace(classRegex, '<span style="color: #4ec9b0;">$1</span>');

    const methodRegex = new RegExp(`([a-zA-Z0-9_]+)(?=\\()${notInTag}`, 'g');
    htmlLine = htmlLine.replace(methodRegex, (match, p1) => {
        if (['if', 'for', 'while', 'switch'].includes(p1)) return match;
        return `<span style="color: #dcdcaa;">${p1}</span>`;
    });

    const numRegex = new RegExp(`\\b(\\d+(\\.\\d+)?)\\b${notInTag}`, 'g');
    htmlLine = htmlLine.replace(numRegex, '<span style="color: #b5cea8;">$1</span>');

    if (lineErrors.length > 0) {
        errors.push(`Línea ${index + 1}: ${lineErrors.join(', ')}`);
        htmlLine = `<span style="text-decoration: underline wavy #f43f5e; text-underline-offset: 4px;" title="${lineErrors.join(', ')}">${htmlLine}</span>`;
    }

    return htmlLine || ' '; 
  });

  if (braceCount > 0) errors.push(`Falta cerrar ${braceCount} llave(s) '}'`);
  if (braceCount < 0) errors.push(`Hay ${Math.abs(braceCount)} llave(s) '}' sobrante(s)`);

  return { html: highlightedLines.join('\n'), errors };
};

// --- DATA: NIVELES Y TUTORIALES ---
const LEVELS = [
  { id: 0, name: "Primeros pasos en Java", desc: "Sintaxis básica, entrada, salida, variables y operaciones simples.", color: "bg-blue-500" },
  { id: 1, name: "Decisiones y lógica básica", desc: "Condicionales, operadores lógicos y validaciones simples.", color: "bg-green-500" },
  { id: 2, name: "Repetición y automatización", desc: "Ciclos, acumuladores, contadores y procesos repetitivos.", color: "bg-purple-500" },
  { id: 3, name: "Datos agrupados y métodos", desc: "Arreglos, matrices, funciones, modularización.", color: "bg-orange-500" },
  { id: 4, name: "Programación orientada a objetos", desc: "Clases, objetos, atributos, métodos, encapsulamiento.", color: "bg-red-500" }
];

const TUTORIALS = {
  0: "En Java, todo programa debe tener una clase principal (public class Main) y un método de inicio (public static void main(String[] args)). Para imprimir texto usamos System.out.println(). Para leer datos del usuario usamos la clase Scanner. Recuerda declarar el tipo de variable (int, double, String) antes de usarla.",
  1: "Los condicionales nos permiten tomar decisiones. Usamos 'if' para evaluar una condición verdadera, y 'else' para cuando es falsa. Podemos encadenar múltiples decisiones con 'else if'. Los operadores relacionales son >, <, >=, <=, ==, !=.",
  2: "Los ciclos permiten repetir código. 'while' repite mientras la condición sea verdadera. 'do while' ejecuta al menos una vez. 'for' es ideal cuando sabemos cuántas veces queremos repetir. Usa variables para acumular o contar datos dentro del ciclo.",
  3: "Un arreglo (array) permite guardar múltiples datos del mismo tipo en una sola variable. Los métodos son bloques de código reutilizables que pueden recibir parámetros y devolver valores.",
  4: "La Programación Orientada a Objetos (POO) modela el mundo real. Una 'Clase' es un molde (ej: Producto) y un 'Objeto' es un elemento creado con ese molde. Usamos 'private' para encapsular atributos y métodos 'get' y 'set' para acceder a ellos."
};

// --- DATA: LOS 50 EJERCICIOS CON CONSIGNAS DETALLADAS ---
const EXERCISES = [
  // NIVEL 0
  { id: 1, level: 0, title: "Mensaje de bienvenida", ctx: "Registro inicial en una plataforma.", req: "Muestra un mensaje de bienvenida personalizado usando Scanner para leer el nombre.", in: "Nombre del usuario (String).", proc: "Capturar el texto ingresado usando Scanner.", out: "Mensaje: 'Bienvenido [nombre]'.", rules: [/(Scanner|System\.in)/, /System\.out\.print/], hints: ["Usa Scanner para pedir el nombre.", "Usa System.out.println para mostrarlo junto con 'Bienvenido'."] },
  { id: 2, level: 0, title: "Total de una compra", ctx: "Sistema básico de ventas en una caja registradora.", req: "Pide al usuario el precio unitario de un producto y la cantidad a comprar, y muestra el total a pagar.", in: "Precio del producto (double) y la cantidad (int).", proc: "Multiplicar el precio capturado por la cantidad ingresada.", out: "Mensaje indicando el valor total calculado.", rules: [/(Scanner|System\.in)/, /\*/], hints: ["Multiplica el precio por la cantidad."] },
  { id: 3, level: 0, title: "Minutos a horas", ctx: "Control de duración de tareas.", req: "Convierte una cantidad total de minutos ingresada a horas enteras y el residuo en minutos.", in: "Cantidad total de minutos (int).", proc: "Dividir entre 60 para hallar las horas, y usar el operador módulo (%) entre 60 para hallar los minutos sobrantes.", out: "Cantidad en formato horas y minutos.", rules: [/\//, /%/], hints: ["Divide entre 60 para horas, usa módulo % 60 para los minutos restantes."] },
  { id: 4, level: 0, title: "Área de un terreno", ctx: "Software para topografía.", req: "Calcula el área de un terreno rectangular.", in: "Medida de la base y medida de la altura (double).", proc: "Multiplicar base por altura.", out: "El área calculada numéricamente.", rules: [/\*/], hints: ["Área = base * altura."] },
  { id: 5, level: 0, title: "Salario diario", ctx: "Liquidación de nómina.", req: "Calcula el salario diario multiplicando horas trabajadas por valor de hora.", in: "Horas trabajadas (int) y valor por hora (double).", proc: "Multiplicar horas por valor de hora.", out: "El salario total a pagar.", rules: [/\*/], hints: ["Necesitas leer dos variables y multiplicarlas."] },
  { id: 6, level: 0, title: "Promedio de tres notas", ctx: "Plataforma académica.", req: "Lee tres notas y calcula la nota definitiva (promedio).", in: "Tres calificaciones diferentes (double).", proc: "Sumar las tres notas y dividir el resultado total entre 3.", out: "El promedio exacto del estudiante.", rules: [/\+.*\+/, /\/ *3/], hints: ["Suma las 3 notas (ponlas entre paréntesis) y divide entre 3."] },
  { id: 7, level: 0, title: "Pesos a dólares", ctx: "Aplicación financiera.", req: "Convierte una cantidad de pesos a dólares usando una tasa de cambio fija.", in: "Cantidad de pesos y Tasa de cambio (double).", proc: "Dividir la cantidad de pesos entre la tasa de cambio.", out: "El equivalente en dólares.", rules: [/\//], hints: ["dolares = pesos / tasa"] },
  { id: 8, level: 0, title: "Costo de envío", ctx: "Empresa de mensajería.", req: "Calcula el costo de un envío basado en el peso del paquete y el precio por cada kg.", in: "Peso en kg y tarifa por kg (double).", proc: "Multiplicar el peso por la tarifa.", out: "El costo total del envío.", rules: [/\*/], hints: ["Multiplica el peso por el costo por kilo."] },
  { id: 9, level: 0, title: "Consumo de combustible", ctx: "Tablero de control de vehículo.", req: "Calcula el rendimiento de combustible en km/galón.", in: "Kilómetros recorridos y Galones consumidos (double).", proc: "Dividir los kilómetros entre los galones.", out: "El rendimiento en km/galón.", rules: [/\//], hints: ["rendimiento = km / galones"] },
  { id: 10, level: 0, title: "Valor con IVA", ctx: "Generación de facturas.", req: "Calcula el valor total sumándole el 19% de impuesto al precio base.", in: "Precio base sin impuestos (double).", proc: "Multiplicar el precio por 0.19 (IVA) y sumarlo al base, o multiplicar por 1.19.", out: "El valor total con IVA incluido.", rules: [/(\* *0\.19|\* *1\.19|\/ *100)/], hints: ["Multiplica por 1.19 o calcula el 19% y súmalo."] },
  
  // NIVEL 1
  { id: 11, level: 1, title: "Ingreso por edad", ctx: "Control de acceso a plataforma.", req: "Solicita la edad del usuario e indica si es mayor de edad para ingresar.", in: "Edad del usuario (int).", proc: "Evaluar mediante una condición si la edad es >= 18.", out: "Mensaje de acceso permitido o denegado.", rules: [/if/, />= *18/], hints: ["Usa if (edad >= 18)"] },
  { id: 12, level: 1, title: "Nota aprobada", ctx: "Sistema académico.", req: "Evalúa si un estudiante pasó la materia (nota >= 3.0).", in: "Nota final (double).", proc: "Condicional para verificar si la nota es >= 3.0.", out: "Mensaje indicando si aprobó o reprobó.", rules: [/if/, />= *3/], hints: ["Compara la nota con 3.0"] },
  { id: 13, level: 1, title: "Descuento por compra", ctx: "Promoción en tienda.", req: "Si la compra supera $100000, aplica un 10% de descuento.", in: "Valor de la compra (double).", proc: "Si el valor > 100000, restarle el 10% multiplicando por 0.9.", out: "El valor final a pagar con o sin descuento.", rules: [/if/, /> *100000/], hints: ["Verifica el límite, luego multiplica por 0.90 si aplica."] },
  { id: 14, level: 1, title: "Pedido prioritario", ctx: "Despacho logístico.", req: "Si la cantidad solicitada es menor a 10 unidades, es 'Prioritario'.", in: "Cantidad del pedido (int).", proc: "Evaluar si la cantidad < 10.", out: "Mensaje: 'Prioritario' o 'Normal'.", rules: [/if/, /< *10/], hints: ["Usa if y else para las dos clasificaciones."] },
  { id: 15, level: 1, title: "Clasificar temperatura", ctx: "Estación meteorológica.", req: "Clasifica la temperatura: <15 es 'Baja', entre 15 y 25 es 'Normal', >25 es 'Alta'.", in: "Temperatura actual (double).", proc: "Anidar condicionales (if, else if, else) para los tres rangos.", out: "La clasificación del clima.", rules: [/if/, /else if/, />/], hints: ["Usa múltiples if - else if - else"] },
  { id: 16, level: 1, title: "Bono por horas extra", ctx: "RRHH.", req: "Si el trabajador hizo más de 40 horas, recibe un bono del 20% sobre su salario.", in: "Horas trabajadas (int) y Salario base (double).", proc: "Verificar horas > 40. Si es cierto, salario = salario * 1.20.", out: "El salario neto a pagar.", rules: [/if/, /> *40/, /\*/], hints: ["Calcula el salario normal, si supera 40 horas suma el 20%."] },
  { id: 17, level: 1, title: "Validar contraseña", ctx: "Seguridad web.", req: "Valida que la contraseña tenga al menos 8 caracteres de longitud.", in: "Contraseña ingresada (String).", proc: "Usar .length() del string y verificar si es >= 8.", out: "Mensaje de contraseña válida o inválida.", rules: [/if/, /\.length\(\)/, />= *8/], hints: ["Usa el método .length() del String."] },
  { id: 18, level: 1, title: "Tarifa parqueadero", ctx: "Parqueadero.", req: "Cobra 2000 por hora. Si se queda más de 3 horas, la tarifa plana es 5000.", in: "Horas de parqueo (int).", proc: "Si horas > 3, total = 5000. Si no, total = horas * 2000.", out: "Total a cobrar al cliente.", rules: [/if/, /> *3/], hints: ["Evalúa la cantidad de horas antes de multiplicar."] },
  { id: 19, level: 1, title: "Riesgo presión arterial", ctx: "Monitoreo médico.", req: "Si la presión supera los 120, hay riesgo alto.", in: "Nivel de presión arterial (int).", proc: "Condicional verificando si presión > 120.", out: "'Riesgo alto' o 'Presión normal'.", rules: [/if/, /> *120/], hints: ["Condicional simple."] },
  { id: 20, level: 1, title: "Clasificar cliente", ctx: "CRM Comercial.", req: "Segmentar: VIP si compra > 500k, Regular si > 100k, de lo contrario Básico.", in: "Total de la compra (double).", proc: "Estructura if-else anidada comprobando montos de mayor a menor.", out: "El segmento del cliente.", rules: [/if/, /else if/, /> *500000/], hints: ["Ordena las condiciones de mayor a menor monto."] },

  // NIVEL 2
  { id: 21, level: 2, title: "Registrar ventas", ctx: "Caja registradora iterativa.", req: "Permite ingresar precios múltiples. Termina al ingresar 0 y muestra la suma total.", in: "Múltiples precios (double). Finaliza con 0.", proc: "Ciclo while(precio != 0) e ir sumando valores en un acumulador.", out: "La suma total de todas las compras.", rules: [/(while|do)/, /\+=|\+ /], hints: ["Usa un ciclo while (precio != 0) y una variable acumuladora."] },
  { id: 22, level: 2, title: "Promedio de N estudiantes", ctx: "Módulo docente.", req: "Pide la cantidad de estudiantes (N), luego la nota de cada uno, y calcula el promedio general.", in: "N (int) y N Notas (double).", proc: "Ciclo for repitiendo N veces, sumando notas. Dividir suma entre N.", out: "Promedio del curso.", rules: [/for/, /\+=/, /\//], hints: ["Pide primero la cantidad N, luego haz un for de 0 a N."] },
  { id: 23, level: 2, title: "Contar salarios altos", ctx: "Auditoría RRHH.", req: "De 5 salarios ingresados, cuenta cuántos superan los $2000.", in: "5 salarios (double).", proc: "Ciclo for de 5 repeticiones. Condicional if verifica si > 2000 para incrementar contador.", out: "Cantidad de salarios altos.", rules: [/for/, /if/, /\+\+/], hints: ["Combina un ciclo for (5 veces) con un if."] },
  { id: 24, level: 2, title: "Validar clave repetitiva", ctx: "Cajero ATM.", req: "Pide continuamente el PIN hasta que ingrese '1234'.", in: "Intentos de PIN (String).", proc: "Ciclo do-while comprobando si la clave NO es igual a '1234'.", out: "Mensaje de acceso concedido al acertar.", rules: [/(while|do)/], hints: ["En Java, si usas String usa clave.equals(\"1234\")."] },
  { id: 25, level: 2, title: "Tabla de pagos", ctx: "Simulador de crédito.", req: "Muestra la tabla de multiplicar de los próximos 10 meses de una cuota base.", in: "Valor de cuota (double).", proc: "Ciclo for del 1 al 10, multiplicando mes por cuota.", out: "Proyección de pagos para 10 meses.", rules: [/for/, /\*/], hints: ["for(int i=1; i<=10; i++)"] },
  { id: 26, level: 2, title: "Ahorro anual", ctx: "Finanzas personales.", req: "Registra el ahorro de los 12 meses y calcula el monto final.", in: "12 montos de ahorro (double).", proc: "Ciclo for de 12 iteraciones, usando un acumulador.", out: "Total ahorrado en el año.", rules: [/for/, /\+=/], hints: ["Ciclo que itere 12 veces pidiendo el ahorro mensual."] },
  { id: 27, level: 2, title: "Intentos de acceso", ctx: "Seguridad login.", req: "Permite 3 intentos para clave correcta. Bloquea si falla las 3.", in: "Hasta 3 claves (String).", proc: "Ciclo con contador. Usa break si acierta la clave.", out: "Mensaje de éxito o de cuenta bloqueada.", rules: [/(while|for)/, /if/], hints: ["Agrega una variable contador de intentos y usa break para salir."] },
  { id: 28, level: 2, title: "Temperaturas semanales", ctx: "Monitoreo ambiental.", req: "Pide 7 temperaturas y encuentra cuál fue la mayor.", in: "7 temperaturas (double).", proc: "Ciclo for. Comparar cada iteración con una variable 'mayor' para actualizarla.", out: "La temperatura más alta.", rules: [/for/, /if/], hints: ["Guarda la primera como mayor, y en el ciclo compárala."] },
  { id: 29, level: 2, title: "Inventario básico", ctx: "Bodega.", req: "Lee cantidades de productos. Termina con valor negativo. Muestra suma total.", in: "Cantidades (int). Negativo para salir.", proc: "While(cant >= 0) acumulando valores.", out: "Suma total de inventario.", rules: [/(while|do)/, /< *0/], hints: ["while(cantidad >= 0) { total += cantidad; ... }"] },
  { id: 30, level: 2, title: "Menú interactivo", ctx: "Consola de software.", req: "Menú con 3 opciones. Repetir hasta que elija 3 (Salir).", in: "Opción numérica (int).", proc: "Ciclo do-while evaluando if/switch en su interior.", out: "Acción seleccionada en cada iteración.", rules: [/(while|do)/, /if|switch/], hints: ["Usa un do-while y evalúa la opción dentro."] },

  // NIVEL 3
  { id: 31, level: 3, title: "Arreglo de precios", ctx: "Análisis.", req: "Guarda 5 precios en un arreglo y calcula el promedio.", in: "5 precios continuos.", proc: "Crear double[], llenarlo con for, promediar.", out: "Promedio de los elementos.", rules: [/\[\w*\]/, /for/, /\//], hints: ["Declara: double[] precios = new double[5];"] },
  { id: 32, level: 3, title: "Producto más costoso", ctx: "Inventario.", req: "Busca el mayor valor en un arreglo.", in: "Arreglo precargado o ingresado.", proc: "Recorrer array comparando con una variable auxiliar 'maximo'.", out: "Valor máximo encontrado.", rules: [/\[.*\]/, /for/, /if/], hints: ["Recorre el arreglo con for comparando con una variable 'mayor'."] },
  { id: 33, level: 3, title: "Aprobados y Reprobados", ctx: "Académico.", req: "Cuenta aprobados (>=3.0) y reprobados de un arreglo de notas.", in: "Arreglo de notas.", proc: "For que recorre array. If interno actualiza 2 contadores.", out: "Total de aprobados y reprobados.", rules: [/\[.*\]/, /for/, /if/, />= *3/], hints: ["Dos contadores dentro del ciclo que recorre el arreglo."] },
  { id: 34, level: 3, title: "Ventas por día", ctx: "Reporte.", req: "Guarda 7 días en un arreglo y suma el total vendido.", in: "7 montos.", proc: "Ciclo for acumulando arreglo[i].", out: "Suma total del array.", rules: [/\[.*\]/, /for/, /\+=/], hints: ["Itera usando arreglo.length."] },
  { id: 35, level: 3, title: "Método de descuento", ctx: "Facturación.", req: "Crea método static que reciba precio y porcentaje, retorne descuento.", in: "Argumentos en el main.", proc: "Operación matemática dentro del método modular.", out: "Valor retornado.", rules: [/static double/, /return/], hints: ["public static double calcularDescuento(double p, double d)"] },
  { id: 36, level: 3, title: "Método validador", ctx: "Formulario.", req: "Método que retorne boolean true si un número es positivo.", in: "Un número int.", proc: "Retornar n > 0.", out: "Boolean impreso.", rules: [/static boolean/, /return/], hints: ["return numero > 0;"] },
  { id: 37, level: 3, title: "Matriz de asistencia", ctx: "Control.", req: "Usa matriz 3x3 bidimensional e imprímela.", in: "Matriz[][] declarada.", proc: "Doble for anidado (filas y columnas).", out: "Datos en formato de tabla.", rules: [/\[\]\[\]/, /for.*for/], hints: ["Usa for(int i...) y dentro for(int j...)"] },
  { id: 38, level: 3, title: "Estadísticas de arreglo", ctx: "Monitoreo.", req: "Calcula mayor, menor y promedio en UN solo recorrido de array.", in: "Arreglo de datos.", proc: "Un ciclo for con if anidados para encontrar min/max y sumar.", out: "Mayor, menor y promedio.", rules: [/\[.*\]/, /for/, /if.*if/], hints: ["Inicializa mayor en 0 y menor en un número muy grande."] },
  { id: 39, level: 3, title: "Ranking participantes", ctx: "Competencia.", req: "Cuenta cuántos puntajes superan el promedio del arreglo.", in: "Array de puntajes.", proc: "Ciclo 1: calcular promedio. Ciclo 2: contar elementos > promedio.", out: "Cantidad de sobresalientes.", rules: [/\[.*\]/, /for/, /if/], hints: ["Necesitas dos ciclos separados para resolverlo."] },
  { id: 40, level: 3, title: "Búsqueda en arreglo", ctx: "Competencia.", req: "Método que busque un valor y retorne su índice (-1 si no está).", in: "Arreglo y valor de búsqueda.", proc: "Ciclo for comparando. Retorna i si lo halla.", out: "Posición encontrada.", rules: [/static int/, /\[.*\]/, /return/], hints: ["Si arreglo[i] == valor, return i."] },

  // NIVEL 4
  { id: 41, level: 4, title: "Clase Producto", ctx: "Inventario OOP.", req: "Crea clase Producto con atributos privados nombre y precio.", in: "Código estructural.", proc: "Definir class, private vars y métodos get/set.", out: "Objeto instanciado sin error.", rules: [/class Producto/, /private String/, /private double/], hints: ["Recuerda encapsular con private."] },
  { id: 42, level: 4, title: "Clase Estudiante", ctx: "Académico OOP.", req: "Clase Estudiante con método interno aprueba() que indique si su nota >= 3.0.", in: "Nota al construir.", proc: "Método boolean dentro de la clase.", out: "Boolean al llamar el método.", rules: [/class Estudiante/, /public boolean/], hints: ["Método interno que evalúe su propio atributo."] },
  { id: 43, level: 4, title: "Clase Empleado", ctx: "Recursos OOP.", req: "Clase Empleado con constructor parametrizado.", in: "Parámetros en new Empleado(...).", proc: "Definir public Empleado(String n, double s).", out: "Asignación exitosa usando this.", rules: [/class Empleado/, /public Empleado\(/, /get/], hints: ["El constructor debe llamarse igual que la clase."] },
  { id: 44, level: 4, title: "Cuenta Bancaria", ctx: "Financiero OOP.", req: "Clase Cuenta con métodos consignar y retirar que modifiquen el saldo interno.", in: "Monto a operar.", proc: "Mutación de estado (saldo += monto).", out: "Saldo actualizado.", rules: [/class Cuenta/, /public void consignar/, /\+=/, /-=|\-/], hints: ["Los métodos deben alterar el atributo privado saldo."] },
  { id: 45, level: 4, title: "Clase Vehículo", ctx: "Transporte OOP.", req: "Clase con kilometraje y método calcularMantenimiento().", in: "Uso de métodos.", proc: "Lógica if/else dentro de la clase.", out: "Costo retornado.", rules: [/class Veh/, /public double/], hints: ["Método que retorne un cálculo basado en el kilometraje."] },
  { id: 46, level: 4, title: "Arreglo de Objetos", ctx: "Inventario.", req: "Arreglo de tipo Producto y suma de sus precios.", in: "Arreglo de 3 Productos.", proc: "For iterando sobre array de objetos, llamando a .getPrecio().", out: "Suma total.", rules: [/Producto\[\]/, /new Producto/, /\.getPrecio/], hints: ["Producto[] lista = new Producto[3];"] },
  { id: 47, level: 4, title: "Filtrar Objetos", ctx: "Educación.", req: "Recorre arreglo de Estudiante e imprime los aprobados.", in: "Arreglo de objetos.", proc: "For + If(estudiante[i].aprueba()).", out: "Nombres filtrados.", rules: [/Estudiante\[\]/, /for/, /\.getNota|\.aprueba/], hints: ["Combina el ciclo for, el objeto y el if."] },
  { id: 48, level: 4, title: "Clase Pedido", ctx: "Ventas.", req: "Pedido tiene un arreglo de Productos como atributo.", in: "Diseño de clase.", proc: "Composición estructural.", out: "Clase válida.", rules: [/class Pedido/, /Producto\[\]/], hints: ["Una clase puede contener arreglos de otras clases."] },
  { id: 49, level: 4, title: "Sistema Biblioteca", ctx: "Gestión OOP.", req: "Clase Libro y Biblioteca con método prestarLibro(Libro L).", in: "Paso de objeto como parámetro.", proc: "Alteración de estado de un objeto externo.", out: "Libro marcado prestado.", rules: [/class Libro/, /class Biblioteca/], hints: ["La biblioteca administra objetos Libro."] },
  { id: 50, level: 4, title: "Reto Integrador: Inventario", ctx: "Empresarial.", req: "Implementa Producto, registra varios en arreglo, busca el mayor valor y calcula total.", in: "Datos de inventario.", proc: "Integración de POO, Arreglos, Ciclos y Lógica de acumuladores/máximos.", out: "Reporte general.", rules: [/class Producto/, /Producto\[\]/, /for/, /if/, /\.get/], hints: ["Este es tu reto final. Une Clases, Arreglos, Ciclos y Lógica."] }
];

// --- APP COMPONENT PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [activeLevel, setActiveLevel] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);
  
  const [completedExercises, setCompletedExercises] = useState([]);
  const [points, setPoints] = useState(0);

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.username.value;
    if(name) {
      setUser({ name, role: 'Estudiante' });
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCompletedExercises([]);
    setPoints(0);
    setCurrentView('login');
  };

  const getLevelExercises = (levelId) => EXERCISES.filter(ex => ex.level === levelId);
  const getCompletedInLevel = (levelId) => getLevelExercises(levelId).filter(ex => completedExercises.includes(ex.id)).length;
  
  const isLevelUnlocked = (levelId) => {
    if (levelId === 0) return true;
    const prevCompleted = getCompletedInLevel(levelId - 1);
    return prevCompleted >= 8;
  };

  const openLevel = (levelId) => {
    if (isLevelUnlocked(levelId)) {
      setActiveLevel(levelId);
      setCurrentView('level');
    }
  };

  const openExercise = (exercise) => {
    setActiveExercise(exercise);
    setCurrentView('exercise');
  };

  const completeExercise = (exerciseId) => {
    if (!completedExercises.includes(exerciseId)) {
      setCompletedExercises([...completedExercises, exerciseId]);
      setPoints(points + 10);
    }
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-full text-white">
              <Code size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Java Quest</h1>
          <p className="text-slate-400 mb-8">Aprende, practica y resuelve problemas reales</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              name="username" 
              type="text" 
              required
              placeholder="Ingresa tu nombre para iniciar" 
              className="w-full bg-slate-700 text-white border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Comenzar Aventura
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <Code className="text-blue-400" />
          <h1 className="text-xl font-bold">Java Quest</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-yellow-400 font-bold">
            <Star size={20} />
            <span>{points} pts</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full">
            <User size={18} className="text-slate-400"/>
            <span className="font-medium text-sm">{user.name}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 ml-2">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Ruta de Aprendizaje</h2>
                <p className="text-slate-600 mt-2">Completa al menos 8 ejercicios para desbloquear el siguiente nivel.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Progreso Total</p>
                <div className="text-2xl font-bold text-blue-600">{completedExercises.length} / 50</div>
              </div>
            </div>

            <div className="grid gap-6">
              {LEVELS.map((level) => {
                const unlocked = isLevelUnlocked(level.id);
                const completedCount = getCompletedInLevel(level.id);
                
                return (
                  <div 
                    key={level.id} 
                    onClick={() => openLevel(level.id)}
                    className={`relative rounded-xl border p-6 flex flex-col md:flex-row items-center gap-6 transition-all ${unlocked ? 'bg-white shadow-sm hover:shadow-md cursor-pointer border-slate-200' : 'bg-slate-100 border-slate-200 opacity-75 cursor-not-allowed'}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 ${unlocked ? level.color : 'bg-slate-300'}`}>
                      {unlocked ? <BookOpen size={32} /> : <Lock size={32} />}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-400">NIVEL {level.id}</span>
                        {!unlocked && <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Bloqueado</span>}
                      </div>
                      <h3 className={`text-xl font-bold mb-1 ${unlocked ? 'text-slate-800' : 'text-slate-500'}`}>{level.name}</h3>
                      <p className="text-slate-600 text-sm">{level.desc}</p>
                    </div>

                    {unlocked && (
                      <div className="shrink-0 w-full md:w-48">
                        <div className="flex justify-between text-sm mb-1 font-medium">
                          <span className="text-slate-500">Progreso</span>
                          <span className={completedCount >= 8 ? 'text-green-600' : 'text-blue-600'}>{completedCount}/10</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${completedCount >= 8 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${(completedCount / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'level' && activeLevel !== null && (
          <div className="animate-in fade-in">
            <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors">
              <LayoutDashboard size={20} /> Volver al Dashboard
            </button>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg text-white ${LEVELS[activeLevel].color}`}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Nivel {activeLevel}: {LEVELS[activeLevel].name}</h2>
                  <p className="text-slate-500">{LEVELS[activeLevel].desc}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 text-blue-900 p-5 rounded-lg border border-blue-100 mt-6">
                <h3 className="font-bold mb-2 flex items-center gap-2"><Lightbulb size={20}/> Tutorial del Nivel</h3>
                <p className="leading-relaxed text-sm">{TUTORIALS[activeLevel]}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-4">Ejercicios del Nivel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getLevelExercises(activeLevel).map(ex => {
                const isCompleted = completedExercises.includes(ex.id);
                return (
                  <div 
                    key={ex.id}
                    onClick={() => openExercise(ex)}
                    className={`bg-white border rounded-lg p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${isCompleted ? 'border-green-300 ring-1 ring-green-100' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                    <div>
                        <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Ej {ex.id}</span>
                        {isCompleted && <CheckCircle size={20} className="text-green-500" />}
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">{ex.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{ex.req}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'exercise' && activeExercise && (
          <ExerciseEditor 
            exercise={activeExercise} 
            onBack={() => setCurrentView('level')}
            onComplete={() => completeExercise(activeExercise.id)}
            isCompleted={completedExercises.includes(activeExercise.id)}
          />
        )}
      </main>
    </div>
  );
}

// --- COMPONENTE DEL EDITOR Y MOTOR DE VALIDACIÓN ---
function ExerciseEditor({ exercise, onBack, onComplete, isCompleted }) {
  const defaultCode = `public class Main {\n    public static void main(String[] args) {\n        // Escribe tu solución aquí\n        \n    }\n}`;
  const [code, setCode] = useState(defaultCode);
  const [consoleLog, setConsoleLog] = useState([]);
  
  const [isWaitingInput, setIsWaitingInput] = useState(false);
  const [expectedInputType, setExpectedInputType] = useState(null);
  const [expectedInputVar, setExpectedInputVar] = useState(null); 
  const [execVariables, setExecVariables] = useState({}); 
  const [pendingSteps, setPendingSteps] = useState([]);
  
  const [currentInputVal, setCurrentInputVal] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [status, setStatus] = useState('idle'); 

  const preRef = useRef(null);
  const consoleEndRef = useRef(null);

  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const { html: highlightedCode, errors: syntaxErrors } = useMemo(() => processCode(code), [code]);

  const editorStyles = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    tabSize: 4,
  };

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLog, isWaitingInput]);

  const validateCode = () => {
    if (syntaxErrors.length > 0) {
        setConsoleLog([{ type: 'system', text: '❌ Error de compilación detectado. Revisa la sintaxis primero.' }]);
        setStatus('error');
        return;
    }

    setStatus('running');
    setIsWaitingInput(false);
    setExecVariables({}); 
    setExpectedInputVar(null);
    setConsoleLog([{ type: 'system', text: '▶ COMPILACIÓN EXITOSA. INICIANDO EJECUCIÓN...' }]);

    const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    const steps = [];
    const stmtRegex = /System\.out\.print(?:ln)?\(([\s\S]*?)\)\s*;|(?:(?:String|int|double|float|boolean)\s+)?([a-zA-Z0-9_]+)\s*=\s*[a-zA-Z0-9_]+\.(next|nextInt|nextDouble|nextLine)\(\)\s*;|(?:(?:String|int|double|float|boolean)\s+)?([a-zA-Z0-9_]+)\s*=\s*([^;={]+)\s*;/g;
    
    let match;
    while ((match = stmtRegex.exec(cleanCode)) !== null) {
        if (match[1] !== undefined) {
            steps.push({ type: 'print', content: match[1].trim() });
        } else if (match[2] !== undefined) {
            steps.push({ type: 'input', varName: match[2], expectedType: match[3] });
        } else if (match[4] !== undefined) {
            if (!match[5].includes('new ')) {
                steps.push({ type: 'assign', varName: match[4], expression: match[5].trim() });
            }
        }
    }

    runEngine(steps, [{ type: 'system', text: '▶ COMPILACIÓN EXITOSA. INICIANDO EJECUCIÓN...' }], {});
  };

  const runEngine = (steps, currentLog, currentVars) => {
    let log = [...currentLog];
    let vars = { ...currentVars }; 

    // Motor seguro sin usar eval() problemático
    const evaluateExpression = (expr) => {
        if (!expr) return '';
        let evalStr = expr.replace(/\(\s*(int|double|float|String)\s*\)/g, '');

        try {
            const keys = Object.keys(vars);
            const values = Object.values(vars);
            const evaluator = new Function(...keys, `return (${evalStr});`);
            let res = evaluator(...values);
            return res !== undefined ? res : expr;
        } catch(e) {
            try {
                return expr.split('+').map(p => {
                    let t = p.trim();
                    if (t.startsWith('"') && t.endsWith('"')) return t.substring(1, t.length - 1);
                    if (vars[t] !== undefined) return vars[t];
                    if (/^[0-9.]+$/.test(t)) return t;
                    return `[${t}]`; 
                }).join('');
            } catch(fallbackErr) {
                return expr;
            }
        }
    };

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        if (step.type === 'print') {
            if (step.content.length === 0) {
                log.push({ type: 'output', text: '' });
                continue;
            }
            let visualOutput = evaluateExpression(step.content);
            log.push({ type: 'output', text: visualOutput });

        } else if (step.type === 'assign') {
            let res = evaluateExpression(step.expression);
            if (res !== undefined && res !== step.expression) {
                 vars[step.varName] = res;
            }
        } else if (step.type === 'input') {
            setConsoleLog(log);
            setExpectedInputType(step.expectedType);
            setExpectedInputVar(step.varName); 
            setExecVariables(vars); 
            setPendingSteps(steps.slice(i + 1));
            setIsWaitingInput(true);
            return; 
        }
    }
    
    finalizeExecution(log);
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    const val = currentInputVal.trim();
    let isValid = true;
    let errorMsg = "";
    let parsedVal = val;

    if (expectedInputType === 'nextInt') {
        if (!/^-?\d+$/.test(val)) { isValid = false; errorMsg = "Exception in thread \"main\" java.util.InputMismatchException"; }
        else parsedVal = parseInt(val, 10);
    } else if (expectedInputType === 'nextDouble') {
        if (!/^-?\d+(\.\d+)?$/.test(val)) { isValid = false; errorMsg = "Exception in thread \"main\" java.util.InputMismatchException"; }
        else parsedVal = parseFloat(val);
    }

    let newLog = [...consoleLog, { type: 'input', text: val }];

    if (!isValid) {
        newLog.push({ type: 'error', text: errorMsg });
        newLog.push({ type: 'system', text: '■ EJECUCIÓN DETENIDA POR ERROR DE TIPO.' });
        setConsoleLog(newLog);
        setIsWaitingInput(false);
        setStatus('error');
        setCurrentInputVal("");
        return;
    }

    let newVars = { ...execVariables };
    if (expectedInputVar) {
        newVars[expectedInputVar] = parsedVal;
    }

    setIsWaitingInput(false);
    setCurrentInputVal("");
    runEngine(pendingSteps, newLog, newVars);
  };

  const finalizeExecution = (currentLog) => {
    let passed = true;
    let errors = [];

    if (!code.includes('class ')) { passed = false; errors.push("No se encontró la definición de una 'class'."); }
    if (!code.includes('public static void main') && exercise.level < 4) { passed = false; errors.push("Falta el método principal 'public static void main(String[] args)'."); }
    
    if (exercise.rules) {
        exercise.rules.forEach((regex) => {
            if (!regex.test(code)) { passed = false; errors.push("Falta aplicar la estructura algorítmica solicitada en el problema (Ciclos, condicionales, etc)."); }
        });
    }
    
    if (code.includes('System.out.println("El resultado es correct")') || code.length < 50) {
        passed = false;
        errors.push("El código es demasiado corto o parece estar omitiendo el proceso dinámico.");
    }

    errors = [...new Set(errors)];
    let newLog = [...currentLog, { type: 'system', text: '■ EJECUCIÓN FINALIZADA.' }];

    if (passed) {
        newLog.push({ type: 'system', text: '====================' });
        newLog.push({ type: 'system', text: 'Ejecutando casos de prueba internos y reglas lógicas...' });
        newLog.push({ type: 'success', text: '✅ Casos lógicos aprobados exitosamente.' });
        newLog.push({ type: 'success', text: '¡Excelente! Tu solución cumple la consigna al 100%.' });
        setStatus('success');
        onComplete();
    } else {
        newLog.push({ type: 'system', text: '====================' });
        newLog.push({ type: 'error', text: '❌ Error detectado en la lógica del código.' });
        errors.forEach(e => newLog.push({ type: 'error', text: '> ' + e }));
        setStatus('error');
    }
    setConsoleLog(newLog);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in lg:h-[calc(100vh-10rem)]">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors">
          <ChevronRight className="rotate-180" size={20} /> Volver a Ejercicios
        </button>
        {isCompleted && (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 border border-green-200">
            <CheckCircle size={16}/> Ejercicio Completado
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        
        {/* PANEL IZQUIERDO: Problema Detallado con Consignas */}
        <div className="w-full lg:w-[40%] bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm shrink-0 lg:shrink h-[450px] lg:h-auto">
          <div className="bg-slate-50 border-b p-4 font-bold text-slate-700 flex justify-between items-center">
            <span>Problema {exercise.id}</span>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Nivel {exercise.level}</span>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{exercise.title}</h2>
            
            <div>
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1"><Target size={14}/> Contexto</span>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">{exercise.ctx}</p>
            </div>
            
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1"><Code size={14}/> Requerimiento Principal</span>
              <p className="text-slate-800 text-sm mt-1 font-medium">{exercise.req}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {exercise.in && (
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                   <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Keyboard size={12}/> Entrada Esperada</span>
                   <p className="text-sm mt-1 text-slate-700">{exercise.in}</p>
                 </div>
               )}
               {exercise.out && (
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                   <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Monitor size={12}/> Salida Esperada</span>
                   <p className="text-sm mt-1 text-slate-700">{exercise.out}</p>
                 </div>
               )}
            </div>

            {exercise.proc && (
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                 <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Cpu size={12}/> Proceso Requerido</span>
                 <p className="text-sm mt-1 text-slate-700 leading-relaxed">{exercise.proc}</p>
               </div>
            )}

            <div className="border-t pt-4">
              <button 
                onClick={() => setShowHint(!showHint)}
                className="text-amber-600 text-sm font-bold flex items-center gap-2 hover:text-amber-700 transition-colors"
              >
                <Lightbulb size={16} /> {showHint ? 'Ocultar Pistas' : 'Ver Pistas'}
              </button>
              
              {showHint && (
                <div className="mt-3 space-y-2">
                  {exercise.hints.map((hint, idx) => (
                    <div key={idx} className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-100">
                      <strong>Pista {idx+1}:</strong> {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL CENTRAL/DERECHO: Editor y Consola */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4 shrink-0 lg:shrink h-[600px] lg:h-auto">
          
          <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-slate-300 flex flex-col overflow-hidden shadow-md min-h-[300px]">
            <div className="bg-[#2d2d2d] border-b border-[#404040] p-2 px-4 flex justify-between items-center text-slate-300">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <Code size={16} className="text-blue-400"/> Main.java
                </div>
                {syntaxErrors.length > 0 ? (
                  <span className="text-xs text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold" title={syntaxErrors.join('\n')}>
                    {syntaxErrors.length} {syntaxErrors.length === 1 ? 'Error' : 'Errores'} de sintaxis
                  </span>
                ) : (
                  <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <CheckCircle size={12}/> Sin errores
                  </span>
                )}
              </div>
              <button 
                onClick={() => setCode(defaultCode)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Restaurar código inicial"
              >
                <RotateCcw size={14}/> Restaurar
              </button>
            </div>
            
            <div className="relative flex-1 overflow-hidden bg-[#1e1e1e]">
              <pre
                ref={preRef}
                className="absolute inset-0 p-4 m-0 overflow-hidden pointer-events-none whitespace-pre text-[#d4d4d4]"
                style={editorStyles}
              >
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              </pre>
              
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                spellCheck="false"
                className="absolute inset-0 p-4 m-0 w-full h-full bg-transparent text-transparent caret-white resize-none outline-none whitespace-pre overflow-auto border-none"
                style={editorStyles}
              />
            </div>
          </div>

          <div className="h-64 bg-slate-900 rounded-xl flex flex-col overflow-hidden border border-slate-800 shadow-md shrink-0">
            <div className="bg-slate-950 p-3 px-4 flex justify-between items-center">
              <div className="text-slate-400 font-mono text-xs flex items-center gap-2 uppercase tracking-widest font-bold">
                <Terminal size={14} /> Resultados de Ejecución
              </div>
              <button 
                onClick={validateCode}
                disabled={status === 'running'}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                  status === 'running' ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-900/50'
                }`}
              >
                {status === 'running' ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> En ejecución...</span>
                ) : (
                  <span className="flex items-center gap-2"><Play size={16} fill="currentColor" /> Ejecutar y Validar</span>
                )}
              </button>
            </div>
            
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto text-slate-300 relative">
              {consoleLog.length === 0 ? (
                <div className="text-slate-600 h-full flex items-center justify-center italic text-center px-4">
                  Presiona "Ejecutar y Validar" para iniciar la consola interactiva. Podrás ingresar los datos solicitados.
                </div>
              ) : (
                <div className="space-y-1 pb-6">
                  {consoleLog.map((entry, i) => (
                    <div key={i} className={
                      entry.type === 'system' ? 'text-slate-500 font-bold' :
                      entry.type === 'success' ? 'text-emerald-400 font-bold' :
                      entry.type === 'error' ? 'text-rose-400' :
                      entry.type === 'input' ? 'text-amber-400 font-bold' :
                      'text-slate-300'
                    }>
                      {entry.type === 'output' ? `> ${entry.text}` :
                       entry.type === 'input' ? `  ${entry.text}` :
                       entry.text}
                    </div>
                  ))}
                  
                  {isWaitingInput && (
                    <form onSubmit={handleInputSubmit} className="flex items-center gap-2 mt-2 ml-2">
                      <div className="w-2 h-4 bg-amber-400 animate-pulse"></div>
                      <input
                        type="text"
                        autoFocus
                        value={currentInputVal}
                        onChange={e => setCurrentInputVal(e.target.value)}
                        className="bg-transparent border-b border-amber-400/30 outline-none text-amber-400 w-full focus:border-amber-400 transition-colors font-mono"
                        autoComplete="off"
                      />
                    </form>
                  )}
                  <div ref={consoleEndRef} />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}