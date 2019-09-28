from app import app
from datahandler import data_handler
from flask import Response
import json
import pickle

from model.analysis import getEvents


@app.route("/")
def hello():
    return "Hello World!"


@app.before_first_request
def loadAllCsv():
    global data
    data = data_handler.loadMeasures()

    global mappings
    mappings = data_handler.loadMappings()


@app.route('/averages', methods=['GET'])
def averages():
    cleanedData = data_handler.cleanData(data)
    responseData = data_handler.calculateAverageFromMeasures(cleanedData)

    responseData.set_index("uniqueId", inplace=True)
    responseData.loc[:, "coordinates"] = data_handler.getCoordinates(responseData.index, mappings)
    responseData.reset_index(inplace=True)

    return Response(responseData.to_json(orient='records'), mimetype="application/json")


@app.route("/predict/<date>", methods=['GET'])
def predicte(date):
    with open('../data/transformed.p', 'rb') as file:
        model = pickle.load(file)


@app.route("/events/<date>", methods=['GET'])
def event(date):
    eventsInBasel = getEvents(date=date)
    return Response(json.dumps(eventsInBasel), mimetype="application/json")
