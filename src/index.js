import React from 'react';
import ReactDOM from 'react-dom';
import {App} from './App';
import Title from './Title';

import './index.css';

import {register} from './serviceWorker';

ReactDOM.render(
    <div>
        <Title />
        <div className="container">
            <App />
        </div>
    </div>
    , document.getElementById('root'));

register();