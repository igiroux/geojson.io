var fs = require('fs'),
    tmpl = fs.readFileSync('data/share.html', 'utf8');

module.exports.save = save;
module.exports.saveBlocks = saveBlocks;
module.exports.load = load;

function saveBlocks(content, callback) {
    var endpoint = 'https://api.github.com/gists';

    d3.json(endpoint)
        .on('load', function(data) {
            callback(null, data);
        })
        .on('error', function(err) {
            callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
        })
        .send('POST', JSON.stringify({
            description: 'via:geojson.io',
            public: false,
            files: {
                'index.html': { content: tmpl },
                'map.geojson': { content: content }
            }
        }));
}

function save(context, callback) {

    var source = context.data.get('source'),
        meta = context.data.get('meta'),
        map = context.data.get('map');

    var description = (source && source.description) || 'via:geojson.io',
        public = (source !== undefined) ? !!source.public : false;

    context.user.details(onuser);

    function onuser(err, user) {
        var endpoint,
            method = 'POST';

        if (!err && user && user.login && meta && meta.login) {
            endpoint = 'https://api.github.com/gists/' + source.id;
            method = 'PATCH';
        } else if (!err && source && source.id) {
            endpoint = 'https://api.github.com/gists/' + source.id + '/forks';
        } else {
            endpoint = 'https://api.github.com/gists';
        }

        context.user.signXHR(d3.json(endpoint))
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(err) {
                callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
            })
            .send(method, JSON.stringify({
                description: description,
                public: public,
                files: {
                    'map.geojson': {
                        content: JSON.stringify(map)
                    }
                }
            }));
    }
}

function load(id, context, callback) {
    context.user.signXHR(d3.json('https://api.github.com/gists/' + id))
        .on('load', onLoad)
        .on('error', onError)
        .get();

    function onLoad(json) { callback(null, json); }
    function onError(err) { callback(err, null); }
}
