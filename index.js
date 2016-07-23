
const _         = require('ramda');
const Bluebird  = require('bluebird');
const awesomize = require('./lib/awesomize');


const throwMiddlewareEmpty = () => {
  throw TypeError('You must provide at least one middleware');
};

const defaultSpec = _.always(_.compose(Bluebird.resolve, _.prop('data')))


const awesomizeSpec = _.curry((req, spec) => awesomize(req, spec))


const getSpec = _.curry((current, req) => _.compose(
  _.ifElse(_.is(Function), awesomizeSpec(req), defaultSpec)
, _.prop('awesomize')
)(current));

const getIO = _.propOr((req, data) => data, 'io');


const getTransform = _.propOr((req, data) => data, 'transform');


const mergeDataIntoReq = (req) => _.compose(_.merge(req), _.objOf('data'));


const mergeIOData = (middleware, req) => _.compose(
  Bluebird.props
, _.merge(_.propOr({}, 'data', req))
, getIO(middleware).bind(middleware, req)
);


const run = _.curry(([current, ...rest], req) => _.composeP(
  (next) => _.length(rest) ? run(rest, next) : next.data
, mergeDataIntoReq(req)
, getTransform(current).bind(current, req)
, mergeIOData(current, req)
, getSpec(current, req)
)(req));


const Middleware = (...middleware) => {
  if(middleware.length < 1) throwMiddlewareEmpty();

  //@TODO validate all the middlewar objects.
  //look in lib/validate.js for inspiration.

  return (req, res, next) => { 
    run(middleware, req)

    .then(res.json.bind(res))

    .catch(next);

  };

};


module.exports = Middleware;
