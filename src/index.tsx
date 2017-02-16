import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, hashHistory } from 'react-router';

import Store from 'utils/Store';
import StoreContext from 'utils/components/StoreContext';
import asyncMiddleware from 'utils/middlewares/asyncMiddleware';
import historyMiddleware from 'utils/middlewares/historyMiddleware';
import initialState from 'messaging/initialState';
import reducer from 'messaging/reducer';
import routes from 'components/routes';
import { Action, State } from 'messaging/types';

const store = new Store<Action, State>(reducer, initialState)
    .pipe(asyncMiddleware)
    .pipe(historyMiddleware(hashHistory))
    .pipe((action, next) => {
        console.log(action);

        next(action);
    });

const element = document.getElementById('app');

ReactDOM.render((
    <StoreContext store={store}>
        <Router history={hashHistory}>
            {routes}
        </Router>
    </StoreContext>
), element);
