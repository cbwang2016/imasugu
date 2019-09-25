import React, {Component, PureComponent} from 'react';
import {BUILDINGS} from './const';

import './Config.css';

const DEFAULT_CONFIG={
    auto_loading: ['理教','二教'],
};

export function load_config() {
    let config=Object.assign({},DEFAULT_CONFIG);
    let loaded_config;
    try {
        loaded_config=JSON.parse(localStorage['imasugu_config']||'{}');
    } catch(e) {
        alert('设置加载失败，将重置为默认设置！\n'+e);
        delete localStorage['imasugu_config'];
        loaded_config={};
    }

    // unrecognized configs are removed
    Object.keys(loaded_config).forEach((key)=>{
        if(config[key]!==undefined)
            config[key]=loaded_config[key];
    });

    console.log('config loaded',config);
    window.config=config;
}
export function save_config() {
    localStorage['imasugu_config']=JSON.stringify(window.config);
    load_config();
}

export class Config extends Component {
    constructor(props) {
        super(props);
        this.state={
            auto_loading: window.config.auto_loading,
        };
    }

    save_config() {
        window.config.auto_loading=this.state.auto_loading;
        save_config();
    }

    toggle(b,e) {
        let chk=e.target.checked;
        this.setState((prevState)=>{
            let new_loading=prevState.auto_loading.filter((x)=>x!==b);
            if(chk)
                new_loading.push(b);
            return {
                auto_loading: new_loading,
            };
        },this.save_config);
    }

    render() {
        return (
            <details>
                <summary className="imsg-config-summary">设置常用教学楼</summary>
                <p>将会自动加载选中的教学楼：</p>
                <p>
                    {BUILDINGS.map((b)=>(
                        <label>
                            <input type="checkbox" checked={this.state.auto_loading.indexOf(b)!==-1} onChange={(e)=>this.toggle(b,e)} />
                            {b}
                            &nbsp;
                        </label>
                    ))}
                </p>
            </details>
        )
    }
}