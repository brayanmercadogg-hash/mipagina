from flask import Flask, render_template, request, flash, redirect, url_for, send_from_directory
import smtplib
from email.mime.text import MIMEText
import os

app = Flask(__name__)
app.secret_key = "mi_clave_secreta_123"

# ==========================================
# VISTAS / RUTAS (ROUTES)
# ==========================================

# HOME (index.html)
@app.route("/")
def home():
    # Asegúrate de que tu archivo se llame index.html o cámbialo aquí a HOME.html
    return render_template("index.html")


# PÁGINA DEL MENÚ (menu.html)
@app.route("/menu")
def menu():
    return render_template("menu.html")

# NUEVA RUTA PARA NOSOTROS
@app.route("/nosotros")
def nosotros():
    return render_template("nosotros.html")


# RUTA PARA EL JSON (Para que tu JavaScript pueda hacer fetch a /static/menu.json)
@app.route("/menu.json")
def obtener_menu_json():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'menu.json')


# CONTACTO Y ENVÍO DE FORMULARIO
# CONTACTO COMPLETO
@app.route("/contacto", methods=["GET", "POST"])
def contacto():
    if request.method == "POST":
        nombre = request.form.get("nombre", "")
        correo = request.form.get("correo", "")
        asunto = request.form.get("asunto", "Mensaje desde la Web")
        mensaje = request.form.get("mensaje", "")

        if not nombre or not correo or not mensaje:
            flash("Faltan datos obligatorios ❌", "error")
            return redirect(url_for("contacto"))

        # Llama a tu función SMTP
        enviar_correo(nombre, correo, asunto, mensaje)

        flash("¡Mensaje enviado correctamente! 🔥 Nos comunicaremos pronto.", "success")
        return redirect(url_for("contacto"))

    # Cuando solo entran a ver la página, renderiza el HTML de contacto
    return render_template("contacto.html")


# ==========================================
# LÓGICA DE ENVÍO DE CORREO (SMTP)
# ==========================================
def enviar_correo(nombre, correo, asunto, mensaje):
    remitente = "brayanmercado.gg@gmail.com"
    
    # ⚠️ RECOMENDACIÓN PRO: No uses tu contraseña real aquí. 
    # En Gmail debes activar "Verificación en 2 pasos" y generar una "Contraseña de Aplicación" de 16 letras.
    password = "8301 328 305" 
    destinatario = "brayanmercado.gg@gmail.com"

    contenido = f"""
    Nuevo mensaje desde la web de Burger & Co:

    Nombre: {nombre}
    Correo: {correo}
    Asunto: {asunto}
    Mensaje: {mensaje}
    """

    msg = MIMEText(contenido)
    msg["Subject"] = asunto
    msg["From"] = remitente
    msg["To"] = destinatario

    try:
        servidor = smtplib.SMTP("smtp.gmail.com", 587)
        servidor.starttls()
        servidor.login(remitente, password)
        servidor.sendmail(remitente, destinatario, msg.as_string())
        servidor.quit()
        print("Correo enviado correctamente 🔥🍔")
    except Exception as e:
        print("Error enviando correo:", e)


if __name__ == "__main__":
    app.run(debug=True)