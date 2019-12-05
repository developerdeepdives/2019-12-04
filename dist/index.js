"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var stream_1 = require("stream");
var filePath = path_1.default.join('.', 'public');
var readStreamOptions = {
    highWaterMark: 512,
};
var rowMaker = function (headers, values) {
    return headers.reduce(function (acc, header, i) {
        acc[header] = values[i];
        return acc;
    }, {});
};
var csvParser = function () {
    var headers = [];
    var unfinished;
    var first = true;
    return new stream_1.Transform({
        objectMode: true,
        transform: function (chunk, _, callback) {
            var _this = this;
            var bits = chunk.toString().split('\n');
            if (first) {
                headers = headers.concat(bits.shift().split(','));
                first = false;
            }
            bits.forEach(function (bit) {
                var rowValues = bit.split(',');
                if (rowValues.length !== headers.length) {
                    if (unfinished) {
                        unfinished += bit;
                        var prettyRow = rowMaker(headers, unfinished.split(','));
                        _this.push(prettyRow);
                        unfinished = null;
                    }
                    else {
                        unfinished = bit;
                    }
                }
                else {
                    var prettyRow = rowMaker(headers, rowValues);
                    _this.push(prettyRow);
                }
            });
            // this.push(chunk.toString())
            // callback(null, chunk.toString())
            callback();
        },
    });
};
var readable = fs_extra_1.default.createReadStream(path_1.default.join(filePath, 'MOCK_DATA.csv'), readStreamOptions).pipe(csvParser());
readable.on('data', function (data) {
    console.log(data);
});
readable.on('end', function () {
    console.log('Finished');
});
