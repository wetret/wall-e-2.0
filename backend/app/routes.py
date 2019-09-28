from app import app
from flask import Response
import json
import pickle
import pandas as pd
import numpy as np
from model import analysis


@app.before_first_request
def loadAll():
    global data
    data = analysis.loadData()

    global cleanedData
    cleanedData = analysis.cleanData(data)

    global transformedData
    transformedData = analysis.transformData(cleanedData)

    global mappings
    mappings = analysis.loadMapping()


@app.route("/")
def hello():
    return "Hello World!"


@app.route('/averages', methods=['GET'])
def averages():
    responseData = analysis.calculateAverages(cleanedData)

    responseData.set_index("uniqueId", inplace=True)
    responseData.loc[:, "coordinates"] = analysis.getCoordinates(responseData.index, mappings)
    responseData.reset_index(inplace=True)

    return Response(responseData.to_json(orient='records'), mimetype="application/json")


@app.route("/predict/<date>/<daySegment>", methods=['GET'])
def predict(date, daySegment):
    with open('../data/model.p', 'rb') as file:
        model = pickle.load(file)

    matchingData = cleanedData[cleanedData["date"] == pd.to_datetime(date).date()]
    matchingData = matchingData.loc[matchingData["time"] == daySegment]

    Xcategories = matchingData[['place_type', 'weekday', 'time', 'isHoliday', 'weatherCat']]
    features = pd.get_dummies(Xcategories, columns=['place_type', 'weekday', 'time', 'weatherCat'])

    predictions = model.predict(features)
    matchingData["cci"] = predictions

    return Response(matchingData.to_json(orient='records'), mimetype="application/json")


@app.route("/events/<date>", methods=['GET'])
def event(date):
    eventsInBasel = analysis.getEvents(date=date)
    return Response(json.dumps(eventsInBasel), mimetype="application/json")
