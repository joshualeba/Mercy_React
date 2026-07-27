from app import app, db
from app import Tipo_Preguntas, Dificultades, Categorias, PreguntasTest, OpcionesRespuesta, Sofipos, Usuarios, DatosP, ResultadosTest, DiagnosticosFinancieros, Glosario

def hard_reset_database():
    with app.app_context():
        print("Creando tablas si no existen...")
        db.create_all()
        print("Iniciando reinicio total de la base de datos...")
        
        # ELIMINAR TODO (Orden corregido por llaves foráneas)
        print("Borrando datos actuales de todas las tablas...")
        ResultadosTest.query.delete()
        DiagnosticosFinancieros.query.delete()
        Usuarios.query.delete()
        DatosP.query.delete()
        OpcionesRespuesta.query.delete()
        PreguntasTest.query.delete()
        Categorias.query.delete()
        Tipo_Preguntas.query.delete()
        Sofipos.query.delete()
        Glosario.query.delete()
        db.session.commit()
        
        # 1. CREAR CATÁLOGOS BASE
        tipos = ['multiple_choice', 'true_false', 'fill_in_the_blank']
        mapa_tipos = {}
        for t in tipos:
            obj = Tipo_Preguntas(nombre=t)
            db.session.add(obj)
            db.session.flush()
            mapa_tipos[t] = obj
        
        dificultades = ['facil', 'medio', 'dificil']
        mapa_dificultades = {}
        for d in dificultades:
            obj = Dificultades(nombre=d)
            db.session.add(obj)
            db.session.flush()
            mapa_dificultades[d] = obj

        categorias = ['ahorro', 'seguros', 'presupuesto', 'economía', 'inversiones', 'deuda', 'ingresos']
        mapa_categorias = {}
        for c in categorias:
            obj = Categorias(nombre=c)
            db.session.add(obj)
            db.session.flush()
            mapa_categorias[c] = obj
            
        print("Catálogos base creados.")

        # 2. CREAR LAS 12 PREGUNTAS FINANCIERAS
        lista_preguntas = [
            # --- FÁCILES (4) ---
            {
                "txt": "¿Qué es el interés simple?",
                "tipo": "multiple_choice", "dif": "facil", "cat": "ahorro",
                "opciones": [
                    ("Intereses calculados solo sobre el capital inicial.", True),
                    ("Intereses calculados sobre el capital y los intereses acumulados.", False),
                    ("Un porcentaje fijo aplicado mensualmente.", False),
                    ("La ganancia de capital en una inversión.", False)
                ]
            },
            {
                "txt": "El seguro de vida es una forma de inversión.",
                "tipo": "true_false", "dif": "facil", "cat": "seguros",
                "opciones": [("Verdadero", False), ("Falso", True)]
            },
            {
                "txt": "El ______ compuesto permite que tus intereses generen más intereses con el tiempo.",
                "tipo": "fill_in_the_blank", "dif": "facil", "cat": "ahorro",
                "correcta_texto": "Interés"
            },
            {
                "txt": "El ______ es la cantidad de dinero que ganas antes de que se deduzcan los impuestos.",
                "tipo": "fill_in_the_blank", "dif": "facil", "cat": "ingresos",
                "correcta_texto": "Salario bruto"
            },
            # --- MEDIAS (4) ---
            {
                "txt": "¿Cuál de los siguientes es un gasto fijo?",
                "tipo": "multiple_choice", "dif": "medio", "cat": "presupuesto",
                "opciones": [
                    ("Comidas en restaurantes.", False),
                    ("Alquiler.", True),
                    ("Entretenimiento.", False),
                    ("Ropa nueva.", False)
                ]
            },
            {
                "txt": "Los fondos de emergencia deben ser fáciles de acceder.",
                "tipo": "true_false", "dif": "medio", "cat": "ahorro",
                "opciones": [("Verdadero", True), ("Falso", False)]
            },
            {
                "txt": "La inflación reduce el ______ de tu dinero con el tiempo.",
                "tipo": "fill_in_the_blank", "dif": "medio", "cat": "economía",
                "correcta_texto": "Poder adquisitivo"
            },
            {
                "txt": "¿Qué es un fondo mutuo?",
                "tipo": "multiple_choice", "dif": "medio", "cat": "inversiones",
                "opciones": [
                    ("Un tipo de préstamo bancario.", False),
                    ("Una cuenta de ahorro de alto rendimiento.", False),
                    ("Un vehículo de inversión que agrupa dinero de múltiples inversores.", True),
                    ("Una tarjeta de crédito con beneficios.", False)
                ]
            },
            # --- DIFÍCILES (4) ---
            {
                "txt": "Pagar solo el mínimo de tu tarjeta de crédito te ayudará a salir de la deuda rápidamente.",
                "tipo": "true_false", "dif": "dificil", "cat": "deuda",
                "opciones": [("Verdadero", False), ("Falso", True)]
            },
            {
                "txt": "¿Cuál es un beneficio clave de diversificar tus inversiones?",
                "tipo": "multiple_choice", "dif": "dificil", "cat": "inversiones",
                "opciones": [
                    ("Garantiza mayores rendimientos.", False),
                    ("Reduce el riesgo general de la cartera.", True),
                    ("Aumenta la liquidez de tus activos.", False),
                    ("Elimina la necesidad de investigación de mercado.", False)
                ]
            },
            {
                "txt": "En el contexto de inversiones, ¿qué representa el término 'beta'?",
                "tipo": "multiple_choice", "dif": "dificil", "cat": "inversiones",
                "opciones": [
                    ("La volatilidad de un activo en relación al mercado.", True),
                    ("El rendimiento garantizado de una cuenta.", False),
                    ("El costo de administración de un fondo.", False),
                    ("La tasa de interés interbancaria.", False)
                ]
            },
            {
                "txt": "Si una inversión ofrece capitalización mensual, ¿cuál es la tasa que refleja el rendimiento real anual?",
                "tipo": "multiple_choice", "dif": "dificil", "cat": "ahorro",
                "opciones": [
                    ("Tasa efectiva anual (TEA).", True),
                    ("Tasa nominal anual (TNA).", False),
                    ("Tasa de interés simple.", False),
                    ("Tasa de inflación anual.", False)
                ]
            }
        ]

        for p_data in lista_preguntas:
            nueva_p = PreguntasTest(
                pregunta=p_data["txt"],
                id_tipoPregunta=mapa_tipos[p_data["tipo"]].id,
                id_dificultad=mapa_dificultades[p_data["dif"]].id,
                id_categoria=mapa_categorias[p_data["cat"]].id,
                respuesta_texto_correcta=p_data.get("correcta_texto")
            )
            db.session.add(nueva_p)
            db.session.flush()
            if "opciones" in p_data:
                for texto, es_correcta in p_data["opciones"]:
                    db.session.add(OpcionesRespuesta(pregunta_id=nueva_p.id, texto_opcion=texto, es_correcta=es_correcta))
        
        print(f"Preguntas cargadas: {len(lista_preguntas)}")

        # 3. CREAR LAS 21 SOFIPOS
        lista_sofipos = [
            ('Nu México', 14.75, 1, 480.5, 'https://nu.com.mx'),
            ('Finsus', 15.01, 365, 135.2, 'https://finsus.mx'),
            ('SuperTasas', 13.50, 364, 160.8, 'https://supertasas.com'),
            ('Klar', 16.00, 30, 145.3, 'https://www.klar.mx'),
            ('Kubo Financiero', 13.80, 365, 140.0, 'https://www.kubofinanciero.com'),
            ('CAME', 10.50, 360, 138.5, 'https://www.came.org.mx'),
            ('Financiera Monte de Piedad', 11.00, 365, 210.3, 'https://www.montepiedad.com.mx'),
            ('Libertad Soluciones', 9.50, 365, 133.1, 'https://www.libertad.com.mx'),
            ('Unagra', 8.00, 365, 132.5, 'https://www.unagra.com.mx'),
            ('Ualá', 15.00, 1, 170.0, 'https://www.uala.mx'),
            ('Stori Cuenta', 15.00, 1, 142.0, 'https://www.storicard.com'),
            ('Hey Banco (Banregio)', 13.00, 7, 150.5, 'https://heybanco.com'),
            ('Cetesdirecto (Cetes)', 11.00, 28, 999.0, 'https://www.cetesdirecto.com'),
            ('BBVA México', 3.00, 365, 118.5, 'https://www.bbva.mx'),
            ('Citibanamex', 3.50, 365, 117.8, 'https://www.banamex.com'),
            ('Banorte', 4.00, 365, 119.1, 'https://www.banorte.com'),
            ('Santander', 3.50, 365, 118.0, 'https://www.santander.com.mx'),
            ('HSBC México', 3.00, 365, 117.0, 'https://www.hsbc.com.mx'),
            ('Scotiabank', 3.20, 365, 116.5, 'https://www.scotiabank.com.mx'),
            ('Banco Azteca', 5.00, 365, 115.0, 'https://www.bancoazteca.com.mx'),
            ('Bancoppel', 4.50, 365, 115.2, 'https://www.bancoppel.com')
        ]

        for nombre, tasa, plazo, nicap, url in lista_sofipos:
            db.session.add(Sofipos(nombre=nombre, tasa_anual=tasa, plazo_dias=plazo, nicap=nicap, url_web=url))

        db.session.commit()
        print("SOFIPOs cargadas.")

        # 4. CREAR GLOSARIO (Como semilla combinada de los originales + SOFIPO)
        lista_glosario = [
            ('Activo', 'Cualquier recurso que posee valor económico y se espera que genere beneficios futuros (dinero, propiedades, inversiones).', 'economia'),
            ('Pasivo', 'Obligaciones financieras o deudas que tienes que pagar en el futuro. Dinero que sale de tu bolsillo.', 'economia'),
            ('Patrimonio neto', 'Es el valor real de tu riqueza. Se calcula restando tus pasivos (lo que debes) de tus activos (lo que tienes).', 'economia'),
            ('Inflación', 'El aumento generalizado de los precios. Significa que con el mismo dinero puedes comprar menos cosas hoy que ayer.', 'economia'),
            ('Deflación', 'Lo opuesto a la inflación. Es una caída generalizada de los precios de bienes y servicios.', 'economia'),
            ('PIB', 'Producto interno bruto: la suma de todos los bienes y servicios producidos por un país. Indica si una economía está creciendo.', 'economia'),
            ('Recesión', 'Cuando la actividad económica disminuye durante varios meses seguidos. Hay menos empleos, menos ventas y la gente gasta menos.', 'economia'),
            ('Liquidez', 'La facilidad para convertir algo en dinero rápido. El efectivo es lo más líquido.', 'economia'),
            ('Solvencia', 'Tu capacidad a largo plazo para pagar todas tus deudas vendiendo tus activos si fuera necesario.', 'economia'),
            ('Tipo de cambio', 'Es el precio de una moneda extranjera en términos de tu moneda local. Afecta importaciones y viajes.', 'economia'),
            ('Remesa', 'Dinero que envían las personas que viven en otro país a sus familiares en su país de origen.', 'economia'),
            ('Tasas de referencia', 'Tasas establecidas por el banco central (como Banxico) que determinan el costo del dinero en un país, afectando créditos e inversiones.', 'economia'),
            ('Impuestos indirectos', 'Impuestos que se aplican al consumo de bienes y servicios, como el IVA o el IEPS, pagados al momento de comprar.', 'economia'),
            ('Interés compuesto', 'Ganar intereses sobre tus intereses. Es el efecto "bola de nieve" que hace crecer tu dinero más rápido con el tiempo.', 'inversion'),
            ('Interés simple', 'Ganancias calculadas únicamente sobre el monto de dinero original invertido, sin sumar los intereses acumulados.', 'inversion'),
            ('Diversificación', 'La regla de "no poner todos los huevos en la misma canasta". Invertir en diferentes activos para reducir riesgos.', 'inversion'),
            ('Renta fija', 'Inversiones donde conoces la ganancia aproximada desde el inicio (ej. Bonos, Cetes). Son más seguras pero dan menos rendimientos.', 'inversion'),
            ('Renta variable', 'Inversiones donde la ganancia no está garantizada y puede subir o bajar (ej. Acciones). Mayor riesgo, mayor potencial de ganancia.', 'inversion'),
            ('Cetes', 'Certificados de la tesorería. Préstamo que le haces al gobierno a cambio de una tasa de interés fija. Es una inversión de bajo riesgo.', 'inversion'),
            ('Acción', 'Una pequeña parte de propiedad de una empresa. Si a la empresa le va bien, tu acción sube de valor.', 'inversion'),
            ('Dividendo', 'La parte de las ganancias que una empresa reparte entre sus dueños (accionistas) periódicamente.', 'inversion'),
            ('Fibra', 'Fideicomiso para invertir en bienes raíces (hoteles, oficinas, plazas) sin necesidad de comprar un inmueble completo.', 'inversion'),
            ('ETF', 'Fondo de inversión que cotiza en bolsa como una acción. Te permite comprar una "canasta" de muchas empresas a la vez.', 'inversion'),
            ('Sofipo', 'Sociedades financieras populares. Entidades reguladas que ofrecen servicios de ahorro e inversión, a menudo con tasas atractivas.', 'inversion'),
            ('NICAP', 'Nivel de Capitalización. Indica la fortaleza financiera de una SOFIPO; un porcentaje superior a 131% (Nivel 1) significa gran solidez.', 'inversion'),
            ('Portafolio', 'El conjunto de todas tus inversiones. Un buen portafolio debe estar diversificado para equilibrar riesgo y ganancia.', 'inversion'),
            ('Plusvalía', 'El aumento del valor de un bien o activo con el paso del tiempo.', 'inversion'),
            ('Minusvalía', 'Cuando un activo vale menos de lo que lo compraste. Se convierte en pérdida real solo si decides vender en ese momento.', 'inversion'),
            ('Horizonte de inversión', 'El tiempo que planeas dejar tu dinero invertido. A mayor horizonte (ej. jubilación), puedes tomar más riesgos.', 'inversion'),
            ('GAT Nominal', 'Ganancia anual total nominal, que es el rendimiento total de un instrumento de inversión o ahorro en un año antes del cobro de impuestos.', 'inversion'),
            ('GAT Real', 'Ganancia anual total real, que es la ganancia por inversión, una vez que se descuenta la inflación.', 'inversion'),
            ('Perfil de riesgo', 'La tolerancia que tienes a perder dinero en una inversión a cambio de buscar mayores ganancias (conservador, moderado, agresivo).', 'inversion'),
            ('CAT', 'Costo anual total. Es el porcentaje real que te cuesta un crédito al año, incluyendo intereses, comisiones y seguros. ¡Siempre compáralo!', 'credito'),
            ('Buró de crédito', 'Sociedad de Información Crediticia que recopila el historial de las personas. Todos los que han tenido crédito están ahí.', 'credito'),
            ('Historial crediticio', 'Tu "boleta de calificaciones" financiera. Muestra tus préstamos pasados y qué tan puntual fuiste pagándolos.', 'credito'),
            ('Score crediticio', 'Una calificación numérica que resume tu historial. Un puntaje alto facilita que te presten dinero a mejores tasas.', 'credito'),
            ('Tasa de interés', 'El precio del dinero. Lo que cobras por prestar o lo que pagas por pedir prestado.', 'credito'),
            ('Hipoteca', 'Un préstamo a largo plazo para comprar una casa, donde la casa misma sirve como garantía de pago.', 'credito'),
            ('Fecha de corte', 'El día del mes en que el banco cierra la cuenta de tu tarjeta y suma todo lo que compraste en los últimos 30 días.', 'credito'),
            ('Fecha límite de pago', 'El último día que tienes para pagar tu tarjeta sin que te cobren intereses moratorios o recargos. ¡Paga a tiempo!', 'credito'),
            ('Pago mínimo', 'La cantidad más pequeña que pide el banco para mantener tu crédito al día. Si solo pagas esto, pagarás muchos intereses.', 'credito'),
            ('Pago para no generar intereses', 'La cantidad exacta que debes pagar para liquidar lo consumido en el mes y evitar pagar recargos.', 'credito'),
            ('Anualidad', 'Comisión anual que cobran algunas tarjetas de crédito por el derecho a usarla y acceder a sus beneficios.', 'credito'),
            ('Amortización', 'El proceso de pagar una deuda gradualmente mediante pagos periódicos de capital e intereses.', 'credito'),
            ('Tasa de amortización', 'Porcentaje de tu pago que se destina a reducir el capital de la deuda versus lo que va a intereses.', 'credito'),
            ('Aval', 'Persona que se compromete legalmente a pagar tu deuda en caso de que tú no puedas hacerlo.', 'credito'),
            ('Fondo de emergencia', 'Ahorro equivalente a 3-6 meses de tus gastos, guardado en un instrumento líquido para imprevistos (salud, desempleo).', 'ahorro'),
            ('Gasto hormiga', 'Pequeños gastos diarios (café, propinas, snacks) que parecen inofensivos, pero al sumarse representan una gran fuga de dinero.', 'ahorro'),
            ('Gasto vampiro', 'Gastos fijos que extraen tu dinero sin darte cuenta, como suscripciones que no usas o fugas de agua/electricidad.', 'ahorro'),
            ('Presupuesto', 'Es un plan para decidir cómo vas a gastar tu dinero antes de tenerlo.', 'presupuesto'),
            ('Regla 50/30/20', 'Regla de presupuesto: 50% para necesidades, 30% para deseos y 20% para ahorro/inversión.', 'presupuesto'),
            ('Ingreso pasivo', 'Dinero que recibes regularmente sin requerir de tu esfuerzo continuo diario (rentas, dividendos, intereses).', 'ahorro'),
            ('Afore', 'Administradora de Fondos para el Retiro. Entidad que maneja tu dinero ahorrado para la jubilación.', 'ahorro'),
            ('Fintech', 'Finance + Technology. Empresas que usan tecnología para ofrecer servicios financieros de forma más ágil.', 'digital'),
            ('Neobanco', 'Un banco 100% digital, sin sucursales físicas. Todo se maneja desde una app y suelen tener costos más bajos.', 'digital'),
            ('Criptomoneda', 'Dinero 100% digital que usa criptografía para seguridad, descentralizado de bancos centrales.', 'digital'),
            ('Blockchain', 'Es la tecnología detrás de las criptomonedas; un libro de registro digital seguro e inalterable.', 'digital'),
            ('Wallet', 'Billetera digital. Una aplicación o dispositivo donde almacenas claves para acceder a tus criptomonedas o realizar pagos.', 'digital'),
            ('Exchange', 'Casa de cambio digital. Plataformas donde puedes comprar y vender criptomonedas u otros activos.', 'digital'),
            ('SPEI', 'Sistema de pagos electrónicos interbancarios. La "carretera" digital para enviar transferencias bancarias en México en segundos.', 'digital'),
            ('DiMo', 'Dinero Móvil. Plataforma del Banco de México para hacer transferencias usando solo el número celular del destinatario.', 'digital'),
            ('Crowdfunding', 'Financiamiento colectivo. Muchas personas aportan pequeñas cantidades de dinero para financiar un proyecto.', 'digital'),
            ('Token', 'Un activo digital emitido en una blockchain. Puede representar dinero, propiedad o derechos.', 'digital'),
            ('Open banking', 'Banca abierta. Sistema que permite compartir tu información financiera de forma segura con otras apps.', 'digital'),
            ('Cashback', 'Reembolso temporal de un porcentaje del dinero que gastas usando una tarjeta o servicio.', 'digital'),
            ('Regulado CNBV', 'Supervisión legal por la Comisión Nacional Bancaria y de Valores, garantizando que un ecosistema digital sea seguro.', 'digital'),
        ]
        
        for termino, desc, cat in lista_glosario:
            db.session.add(Glosario(termino=termino, descripcion=desc, categoria=cat))

        db.session.commit()
        print("Glosario cargado.")

        print("¡Base de datos REINICIADA y poblada con éxito!")

if __name__ == '__main__':
    hard_reset_database()