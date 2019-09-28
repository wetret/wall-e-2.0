from app import app
from flask import Response
import json
import pickle
import pandas as pd
import numpy as np

from backend.model import analysis


@app.before_first_request
def loadAll():
    global data
    data = analysis.loadData()

    global cleanedData
    cleanedData = analysis.cleanData(data)

    # global transformedData
    # transformedData = analysis.transformData(cleanedData)

    global mappings
    mappings = analysis.loadMapping()

    global model
    with open('../data/model.p', 'rb') as file:
        model = pickle.load(file)



@app.route("/")
def hello():
    return "Hello World!"


@app.route('/averages', methods=['GET'])
def averages():
    responseData = analysis.calculateAverages(cleanedData)
    responseData.loc[:, "coordinates"] = analysis.getCoordinates(responseData.index, mappings)
    responseData.reset_index(inplace=True)

    return Response(responseData.to_json(orient='records'), mimetype="application/json")


@app.route("/predict/<date>/<daySegment>", methods=['GET'])
def predict(date, daySegment):

    # create feature for sample to predict
    timeStamp = pd.to_datetime(date)
    realDate = pd.to_datetime(date).date()
    weekDay = timeStamp.weekday()
    time = daySegment
    isHoliday = analysis.getHoliday(realDate)
    weather = analysis.getWeatherForDate(date)

    allIds = cleanedData['uniqueId'].unique()
    allIds.loc[:, 'place_type'] = cleanedData['place_type']
    allIds.loc[:, 'weekday'] = weekDay
    allIds.loc[:, 'time'] = time
    allIds.loc[:, 'isHoliday'] = isHoliday
    allIds.loc[:, 'weatherCat'] = weather

    #
    # matchingData = cleanedData[cleanedData["date"] == pd.to_datetime(date).date()]
    # matchingData = matchingData.loc[matchingData["time"] == daySegment]

    # Xcategories = matchingData[['place_type', 'weekday', 'time', 'isHoliday', 'weatherCat']]
    features = pd.get_dummies(allIds, columns=['place_type', 'weekday', 'time', 'weatherCat'])

    predictions = model.predict(features)
    allIds.loc[:, "cci"] = predictions

    allIds.set_index('uniqueId', inplace=True)
    allIds.loc[:, "coordinates"] = analysis.getCoordinates(allIds.index, mappings)
    allIds.reset_index(inplace=True)

    return Response(allIds.to_json(orient='records'), mimetype="application/json")


@app.route("/events/<date>", methods=['GET'])
def event(date):
    eventsInBasel = analysis.getEvents(date=date)
    return Response(json.dumps(eventsInBasel), mimetype="application/json")
