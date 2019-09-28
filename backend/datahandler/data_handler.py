import pandas as pd


def loadMeasures():
    data = pd.read_csv("../data/2019-09-27-basel-measures.csv", delimiter=";")
    data = data.iloc[:, 0:17]
    data.loc[:, "date"] = pd.to_datetime(data["date"])
    data.loc[:, "key"] = data["osm_id"].map(str) + "-" + data["cci_id"].map(str)

    return data


def removeOccurancesLessThenFromMeasures(smallest, data):
    countPerKey = data["key"].value_counts() > smallest
    trueKeys = countPerKey[countPerKey]
    cleanData = data[data["key"].isin(trueKeys.index)]

    return cleanData


def calculateAverageFromMeasures(data):
    averagesPerKey = data[
        ["key", "cci", "rateCigarrettes", "ratePapers", "rateBottles", "rateExcrements", "rateSyringues", "rateGums",
         "rateLeaves", "rateGrits", "rateGlassDebris"]].groupby("key").mean().reset_index()

    return averagesPerKey


def loadMappings():
    data = pd.read_csv('../data/2019-09-27-basel-collections.csv', delimiter=',')
    # keepData = originalData[['geometry', 'coordinates']]
    # drop na osm_id
    cleanIndex = data['osm_id'].dropna().index
    keepData = data.loc[cleanIndex, ['geometry', 'coordinates', 'osm_id', 'cci_id']]
    keepData.loc[:, 'uniqueId'] = keepData['osm_id'].apply(lambda x: str(int(x))) + "-" + keepData['cci_id'].apply(lambda x: str(x))

    keepData.set_index('uniqueId', inplace=True)
    keepData.drop(columns=['osm_id', 'cci_id'], inplace=True)
    return keepData


def getCoordinates(uniqueIds, mappings):
    coords = mappings.loc[uniqueIds, 'coordinates']
    return coords