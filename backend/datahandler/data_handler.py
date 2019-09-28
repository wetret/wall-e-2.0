import pandas as pd


def loadMeasures():
    originalData = pd.read_csv('../data/2019-09-27-basel-measures.csv', delimiter=';')

    data = originalData.iloc[:, 0:17]
    data.loc[:, 'uniqueId'] = data['osm_id'].apply(lambda x: str(x)) + "-" + data['cci_id'].apply(
        lambda x: str(x))
    data.loc[:, 'timestamp'] = data.loc[:, 'date'].apply(lambda x: pd.to_datetime(x))
    data.loc[:, 'date'] = data.loc[:, 'timestamp'].apply(lambda x: x.date())
    data.loc[:, 'weekday'] = data.loc[:, 'timestamp'].apply(lambda x: x.weekday())
    # hour seems to be plateauish
    data.loc[:, 'hour'] = data.loc[:, 'timestamp'].apply(lambda x: x.hour)
    data.loc[:, 'time'] = data.loc[:, 'timestamp'].apply(lambda x: getTimeCat(x))
    data.loc[:, 'isHoliday'] = data.loc[:, 'date'].apply(lambda x: getHoliday(x))

    return data


def cleanData(data):
    measurementsPerId = data[['timestamp', 'uniqueId']].groupby('uniqueId').count()
    # clean elements with q<= 0.05
    thresholdValue = measurementsPerId.quantile(0.05).values[0]
    filterLowFrequency = measurementsPerId['timestamp'] >= thresholdValue
    dataWithoutRare = data[data['uniqueId'].isin(filterLowFrequency[filterLowFrequency].index.tolist())]

    return dataWithoutRare


def calculateAverageFromMeasures(data):
    averagesPerKey = data[
        ["uniqueId", "cci", "rateCigarrettes", "ratePapers", "rateBottles", "rateExcrements", "rateSyringues", "rateGums",
         "rateLeaves", "rateGrits", "rateGlassDebris"]].groupby("uniqueId").mean().reset_index()

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


def getTimeCat(timestamp):
    if timestamp.hour <= 11:
        return 'morning'
    elif timestamp.hour <= 17:
        return 'afternoon'
    else:
        return 'evening'


def getHoliday(date):
    isHoliday = 0
    if pd.to_datetime('2019-04-15') <= date <= pd.to_datetime('2019-04-27'):
        isHoliday = 1
    elif date == pd.to_datetime('2019-05-01'):
        isHoliday = 1
    elif pd.to_datetime('2019-05-30') <= date <= pd.to_datetime('2019-06-02'):
        isHoliday = 1
    elif date == pd.to_datetime('2019-06-10'):
        isHoliday = 1
    elif pd.to_datetime('2019-06-29') <= date <= pd.to_datetime('2019-08-10'):
        isHoliday = 1
    elif pd.to_datetime('2019-09-28') <= date <= pd.to_datetime('2019-10-212'):
        isHoliday = 1
    return isHoliday