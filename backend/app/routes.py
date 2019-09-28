from app import app
from datahandler import data_handler
from flask import Response


@app.before_first_request
def loadAllCsv():
    global data
    data = data_handler.loadMeasures()

    global mappings
    mappings = data_handler.loadMappings()


@app.route('/averages')
def averages():
    cleanedData = data_handler.removeOccurancesLessThenFromMeasures(10, data)
    responseData = data_handler.calculateAverageFromMeasures(cleanedData)

    responseData.set_index("key", inplace=True)
    responseData.loc[:, "coordinates"] = data_handler.getCoordinates(responseData.index, mappings)
    responseData.reset_index(inplace=True)

    return Response(responseData.to_json(orient='records'), mimetype="application/json")


