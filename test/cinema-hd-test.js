'use strict';

var expect = require('chai').expect;
var requireHelper = require('./helpers/require_helper');
var mocks = require('./helpers/mocks');
var cinemaHd = requireHelper.requireCoverage(__dirname, '../libs/cinema-hd');

describe('cinema-hd module', function () {

  var kinopoiskStub;

  before(function () {
    kinopoiskStub = mocks.kinopoiskStubInit();
  });

  after(function () {
    mocks.kinopoiskStubRestore(kinopoiskStub);
  });

  describe('test real cinema-hd links', function () {
    it('#getFirstEntryInfo should return not empty entryId', function (done) {
      cinemaHd.getFirstEntryInfo(0, function (err, entryId) {
        expect(err).to.be.null;
        expect(entryId).to.be.not.empty;
        done();
      });
    });

    it('#getFilmsFromPage should return no error', function (done) {
      mocks.kinopoiskStubRestore(kinopoiskStub);
      cinemaHd.getFilmsFromPage(1, null, null,
        function (err, pageContainsAlreadySynchronizedEntry) {
          kinopoiskStub = mocks.kinopoiskStubInit();
          expect(err).to.be.null;
          expect(pageContainsAlreadySynchronizedEntry).to.be.false;
          done();
        });
    });
  });

  describe('#getFirstEntryInfo', function () {

    afterEach(function () {
      mocks.cleanAllNocks();
    });

    it('mock page 1 should return not empty entryId', function (done) {
      var nock = mocks.cinemaHdNock(1);
      cinemaHd.getFirstEntryInfo(1, function (err, entryId) {
        expect(err).to.be.null;
        expect(entryId).to.be.equal('entryID19157');
        nock.done();
        done();
      });
    });

    it('mock page 2 should return not empty entryId', function (done) {
      var nock = mocks.cinemaHdNock(2);
      cinemaHd.getFirstEntryInfo(2, function (err, entryId) {
        expect(err).to.be.null;
        expect(entryId).to.be.equal('entryID19054');
        nock.done();
        done();
      });
    });

    it('mock page 3 should return not empty entryId', function (done) {
      var nock = mocks.cinemaHdNock(3);
      cinemaHd.getFirstEntryInfo(3, function (err, entryId) {
        expect(err).to.be.null;
        expect(entryId).to.be.equal('entryID19138');
        nock.done();
        done();
      });
    });

    it('should return error when cinema hd request returns error', function (done) {
      //replace ony 1, request to 42 will throw error
      mocks.cinemaHdNock(1);
      cinemaHd.getFirstEntryInfo(42, function (err, entryId) {
        expect(err).to.be.not.null;
        expect(entryId).to.be.undefined;
        done();
      });
    });

    it('should return error when cinema hd request returns not 200 status', function (done) {
      var nock = mocks.cinemaHdNockWithoutReply('responseCode500')
        .reply(500);
      cinemaHd.getFirstEntryInfo('responseCode500', function (err, entryId) {
        expect(err).to.be.not.null;
        expect(entryId).to.be.undefined;
        nock.done();
        done();
      });
    });
  });

  describe('#getFilmsFromPage', function () {

    afterEach(function () {
      mocks.cleanAllNocks();
    });

    var checkFieldsInResult = function (result) {
      if (result) {
        var properties = ['cinemaHdId', 'kinopoiskId', 'img', 'title', 'alternativeTitle',
          'description', 'rating', 'votes', 'year'];
        result.forEach(function (item) {
          properties.forEach(function (prop) {
            expect(item).to.have.property(prop);
          });
        });
      }
    };

    it('should return empty result for page 1', function (done) {
      var nock = mocks.cinemaHdNock(1);
      cinemaHd.getFilmsFromPage(1, null, null,
        function (err, pageContainsAlreadySynchronizedEntry, result) {
          expect(err).to.be.null;
          expect(result).to.be.empty;
          expect(pageContainsAlreadySynchronizedEntry).to.be.false;
          nock.done();
          done();
        });
    });

    it('should return 2 elements for page 2', function (done) {
      var nock = mocks.cinemaHdNock(2);
      cinemaHd.getFilmsFromPage(2, null, null,
        function (err, pageContainsAlreadySynchronizedEntry, result) {
          expect(err).to.be.null;
          expect(result).to.have.length(2);
          checkFieldsInResult(result);
          expect(pageContainsAlreadySynchronizedEntry).to.be.false;
          nock.done();
          done();
        });
    });

    it('should return 1 element in result for page 3', function (done) {
      var nock = mocks.cinemaHdNock(3);
      cinemaHd.getFilmsFromPage(3, null, null,
        function (err, pageContainsAlreadySynchronizedEntry, result) {
          expect(err).to.be.null;
          expect(result).to.have.length(1);
          checkFieldsInResult(result);
          expect(pageContainsAlreadySynchronizedEntry).to.be.false;
          nock.done();
          done();
        });
    });

    it('should return empty result for page with error id', function (done) {
      var nock = mocks.cinemaHdNock('badKinopoiskId');
      cinemaHd.getFilmsFromPage('badKinopoiskId', null, null,
        function (err, pageContainsAlreadySynchronizedEntry, result) {
          expect(err).to.be.null;
          expect(result).to.be.empty;
          expect(pageContainsAlreadySynchronizedEntry).to.be.false;
          nock.done();
          done();
        });
    });

    it('should return error when cinema hd request returns error', function (done) {
      //replace ony 1, request to 42 will throw error
      mocks.cinemaHdNock(1);
      cinemaHd.getFilmsFromPage(42, null, null,
        function (err, pageContainsAlreadySynchronizedEntry, result) {
          expect(err).to.be.not.null;
          expect(result).to.be.undefined;
          expect(pageContainsAlreadySynchronizedEntry).to.be.undefined;
          done();
        });
    });

    it('should return error when cinema hd request returns not 200 status', function (done) {
      var nock = mocks.cinemaHdNockWithoutReply(42)
        .reply(500);
      cinemaHd.getFilmsFromPage(42, null, null,
        function (err, pageContainsAlreadySynchronizedEntry, result) {
          expect(err).to.be.not.null;
          expect(result).to.be.undefined;
          expect(pageContainsAlreadySynchronizedEntry).to.be.undefined;
          nock.done();
          done();
        });
    });

    it('should return flag that page contains already synchronized entry', function (done) {
      var nock = mocks.cinemaHdNock(1);
      cinemaHd.getFilmsFromPage(1, 'entryID19152', null,
        function (err, pageContainsAlreadySynchronizedEntry, result) {
          expect(err).to.be.null;
          expect(result).to.be.empty;
          expect(pageContainsAlreadySynchronizedEntry).to.be.true;
          nock.done();
          done();
        });
    });
  });
});