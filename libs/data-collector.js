var cronJob = require('cron').CronJob,
    cinema_hd = require('./cinema-hd'),
    config = require('../config'),
    async = require('async'),
    log = require('./log')(module),
    Film = require('../model/film').Film,
    SyncInfo = require('../model/sync-info').SyncInfo,
    kinopoisk = require('kinopoisk-ru');

//every day
new cronJob('0 0 0 * * *', function(){
    console.log("Cron is running" + new Date());
    updateData();
}, null, true);

var updateData = function () {
    SyncInfo.findOne({}, function(err, syncInfo) {
        if (err){
            log.error(err);
            return ;
        }
        var lastSyncDate;
        var lastSyncEntry;
        if(syncInfo){
            lastSyncDate = syncInfo.lastDate;
            lastSyncEntry = syncInfo.lastEntry;
        }
        var startPage = 1;
        kinopoisk.login(config.kinopoiskUser, config.kinopoiskPassword, function(err, loginData){
            var kinopoiskLoginData = [];
            if(err){
                log.error('Kinopoisk error: ' + err.message + '. Synchronization was run without credentials');
            }else{
                kinopoiskLoginData = loginData;
            }

            cinema_hd.getFirstEntryInfo(startPage, function(firstEntryId, firstEntryDate){
                var series = [];
                for (var page = startPage; page <= config.cinemahdFirstCount; page++) {
                    (function (page) {
                        //processInterrupted = true - next entries alredy synchronized earlier
                        series.push(function (processInterrupted, seriesCallResult, callback) {
                            //first call
                            if(typeof processInterrupted == 'function'){
                                callback = processInterrupted;
                                processInterrupted = false;
                                seriesCallResult = [];
                            }
                            if(!processInterrupted){
                                cinema_hd.getFilmsFromPage(page, lastSyncDate, lastSyncEntry, kinopoiskLoginData, function (err, pageContainsAlreadySynchronizedEntry, result) {
                                    if(err) callback(err);
                                    for (var i = 0; i < result.length; i++) {
                                        seriesCallResult.push(result[i]);
                                    }
                                    log.info(page / config.cinemahdFirstCount * 100 + '%');
                                    callback(null, pageContainsAlreadySynchronizedEntry, seriesCallResult);
                                });
                            }else{
                                callback(null, processInterrupted, seriesCallResult);
                            }
                        });
                    })(page);
                }
                async.waterfall(series, function (err, processInterrupted, seriesCallResult) {
                    if(err) return log.error(err);
                    var finished = function(){
                        if(!syncInfo){
                            syncInfo = new SyncInfo();
                        }
                        syncInfo.lastEntry = firstEntryId;
                        syncInfo.lastDate = firstEntryDate;
                        syncInfo.save(function(err){
                            if (err) throw err;
                            log.info('Synchronization finished');
                        });
                    };
                    if(seriesCallResult.length > 0){
                        for (var i = 0; i < seriesCallResult.length; i++) {
                            var film = seriesCallResult[i];
                            (function (film, i) {
                                film.save(function (err, saved) {
                                    if (err) throw err;//handle error
                                    log.info('Film with id ' + film.kinopoisk_id + ' successfully saved to db');
                                    if(i == seriesCallResult.length - 1){
                                        finished();
                                    }
                                });
                            }(film, i));
                        }
                    }else{
                        finished();
                    }
                });
            })
        });
    });

};

module.exports.updateData = updateData;