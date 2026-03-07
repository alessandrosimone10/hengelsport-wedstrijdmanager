from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from irm_kmi_api import IrmKmiApi

app = Flask(__name__)

# DATABASE CONFIG
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# MODELS
class Competition(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    date = db.Column(db.Date)
    location = db.Column(db.String(100))
    status = db.Column(db.String(20))
    entry_fee = db.Column(db.Float)

    participants = db.relationship('Participant', backref='competition', lazy=True)


class Participant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    number = db.Column(db.Integer)
    competition_id = db.Column(db.Integer, db.ForeignKey('competition.id'))
    owner_id = db.Column(db.Integer)


# HOME
@app.route('/')
def index():
    competitions = Competition.query.all()
    return render_template('index.html', competitions=competitions)


# CREATE COMPETITION
@app.route('/add_competition', methods=['POST'])
def add_competition():
    name = request.form['name']
    date = datetime.strptime(request.form['date'], "%Y-%m-%d")
    location = request.form['location']
    status = request.form['status']
    entry_fee = request.form['entry_fee']

    comp = Competition(
        name=name,
        date=date,
        location=location,
        status=status,
        entry_fee=entry_fee
    )

    db.session.add(comp)
    db.session.commit()

    return redirect(url_for('index'))


# VIEW COMPETITION
@app.route('/competition/<int:id>')
def view_competition(id):
    competition = Competition.query.get_or_404(id)
    participants = Participant.query.filter_by(competition_id=id).all()

    return render_template(
        "competition.html",
        competition=competition,
        participants=participants
    )


# ADD PARTICIPANT
@app.route('/add_participant/<int:competition_id>', methods=['POST'])
def add_participant(competition_id):

    name = request.form['name']
    number = request.form['number']

    participant = Participant(
        name=name,
        number=number,
        competition_id=competition_id
    )

    db.session.add(participant)
    db.session.commit()

    return redirect(url_for('view_competition', id=competition_id))


# WEATHER
@app.route('/weather/<city>')
def weather(city):

    api = IrmKmiApi()

    data = api.get_forecast_by_place(city)

    return render_template(
        "weather.html",
        city=city,
        weather=data
    )


# INIT DB
@app.route('/initdb')
def initdb():
    db.create_all()
    return "Database created!"


if __name__ == '__main__':
    app.run(debug=True)
