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
    # data = analysis.loadData()
    with open('../data/raw.p', 'rb') as file:
        data = pickle.load(file)

    global cleanedData
    # cleanedData = analysis.cleanData(data)
    with open('../data/cleaned.p', 'rb') as file:
        cleanedData = pickle.load(file)

    global transformedData
    # transformedData = analysis.transformData(cleanedData)
    with open('../data/transformed.p', 'rb') as file:
        transformedData = pickle.load(file)

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
    responseData.set_index('uniqueId', inplace=True)
    responseData.loc[:, "coordinates"] = analysis.getCoordinates(responseData.index, mappings)
    responseData.reset_index(inplace=True)

    return Response(responseData.to_json(orient='records'), mimetype="application/json")


@app.route('/predict/csv', methods=['GET'])
def predictCsv():
    responseData = analysis.predictTheLot(cleanedData, model, transformedData)
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

    allIds = cleanedData[['uniqueId', 'place_type']].drop_duplicates(['uniqueId'])
    allIds.loc[:, 'weekday'] = weekDay
    allIds.loc[:, 'time'] = time
    allIds.loc[:, 'isHoliday'] = isHoliday
    allIds.loc[:, 'weatherCat'] = weather
    allIds.loc[:, 'wasJustCleaned'] = 0

    featureData = allIds[['place_type', 'weekday', 'time', 'isHoliday', 'weatherCat', 'wasJustCleaned']]
    features = pd.get_dummies(featureData, columns=['place_type', 'weekday', 'time', 'weatherCat'])

    transformedColumns = transformedData['featureNames']
    transData = pd.DataFrame(0, columns=transformedColumns, index=features.index)

    for col in features.columns:
        transData.loc[:, col] = features.loc[:, col]

    predictions = model.predict(np.array(transData))
    allIds.loc[:, "cci"] = predictions

    allIds.set_index('uniqueId', inplace=True)
    allIds.loc[:, "coordinates"] = analysis.getCoordinates(allIds.index, mappings)

    # add name
    nameData = cleanedData[["uniqueId", "place_name"]].drop_duplicates(['uniqueId']).set_index('uniqueId')
    allIds.loc[:, "place_name"] = nameData

    allIds.reset_index(inplace=True)

    return Response(allIds.to_json(orient='records'), mimetype="application/json")


@app.route("/events/<date>", methods=['GET'])
def event(date):
    eventsInBasel = analysis.getEvents(date=date)
    return Response(json.dumps(eventsInBasel), mimetype="application/json")
