import React, { Component, PureComponent } from 'react';
import {PKUHELPER_ROOT} from './infrastructure/const';
import {BLACKLIST, BUILDINGS, TIMEPIECES, API_BASE} from './const';
import {PiecesBar, Details} from './Pieces';

import './App.css';
import {listen_darkmode} from './infrastructure/functions';
import {load_config, Config} from './config';

const LOADING_TEXT={
    'done':'',
    'collapsed': '点击显示',
    'loading':'加载中',
    'failed':'加载失败',
    'idle':'点击加载',
};

// https://stackoverflow.com/questions/46946380/fetch-api-request-timeout
function fetch_with_timeout(url, options, timeout=5000) {
    return Promise.race([
        fetch(url,options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout)
        )
    ]);
}

function Title() {
    return (
        <div>
            <br />
            <p>以下为今日空闲教室，点击或拖拽下面的方框来筛选时间。</p>
            <br />
        </div>
    );
}

function Footer(props) {
    return (
        <div>
            <br />
            <p className="imsg-room-blacklist">
                下列不允许自习或需要预约的教室未显示：
                {Object.keys(props.blacklist).map((k)=>props.blacklist[k].map((r)=>k+r).join('、')).filter((x)=>x).join('、')}
            </p>
            <br />
            <Config />
            <br />
            <p>
                <a onClick={()=>{
                    if('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations()
                            .then((registrations)=>{
                                for(let registration of registrations) {
                                    console.log('unregister',registration);
                                    registration.unregister();
                                }
                            });
                    }
                    setTimeout(()=>{
                        window.location.reload(true);
                    },200);
                }}>强制检查更新</a>&nbsp;
                ([{process.env.REACT_APP_BUILD_INFO||'---'}] {process.env.NODE_ENV})
            </p>
            <p>Based on Project <b>imasugu!</b> by @xmcp</p>
            <p>
                基于&nbsp;
                <a href="https://www.gnu.org/licenses/gpl-3.0.zh-cn.html" target="_blank">GPLv3</a>
                &nbsp;协议在 <a href="https://github.com/pkuhelper-web/imasugu" target="_blank">GitHub</a> 开源
            </p>
            <br />
        </div>
    )
}

export class App extends Component {
    constructor(props) {
        super(props);
        load_config();
        listen_darkmode(undefined);

        function mk_obj(keys,value) {
            let res={};
            for(let key of keys)
                res[key]=value;
            return res;
        }
        let pieces=App.get_current_pieces();
        this.state={
            loading_status: mk_obj(BUILDINGS,'idle'),
            data: mk_obj(BUILDINGS,null),
            timepieces: pieces,
            filter: [],
        }
    }

    static get_start_piece() {
        //return 1;//////
        let now=new Date();
        for(let i=1;i<TIMEPIECES.length-1;i++)
            if(now.getHours()<TIMEPIECES[i][0] || (now.getHours()===TIMEPIECES[i][0] && now.getMinutes()<TIMEPIECES[i][1]))
                return i;
        return TIMEPIECES.length-1; // after the last course is over
    }
    static get_current_pieces() {
        let start=this.get_start_piece();
        let ret=[];
        for(let i=Math.max(1,start-1);i<TIMEPIECES.length-1;i++)
            ret.push(i);
        if(ret.length===0) // impossible
            throw Error('no timepieces');
        return ret;
    }

    toggle_collapse(name) {
        function fix_building_name(rows) {
            rows.forEach((row)=>{
                row.room=row.room.replace(/\D/g,'');
            });
            return rows;
        }

        if(this.state.loading_status[name]==='idle' || this.state.loading_status[name]==='failed') { // load
            this.setState((prevState)=>{
                let state=Object.assign({},prevState);
                state.loading_status[name]='loading';
                return state;
            });

            fetch_with_timeout(API_BASE.replace('{building}',encodeURIComponent(name)))
                .then((res)=>res.json())
                .then((json)=>{
                    if(Array.isArray(json))
                        json={
                            success: true,
                            rows: json,
                        };
                    if(!json.success)
                        throw json;
                    this.setState((prevState)=>{
                        let state=Object.assign({},prevState);
                        state.loading_status[name]='done';
                        state.data[name]=fix_building_name(json.rows);
                        return state;
                    });
                })
                .catch((err)=>{
                    console.trace(err);
                    this.setState((prevState)=>{
                        let state=Object.assign({},prevState);
                        state.loading_status[name]='failed';
                        state.data[name]=null;
                        return state;
                    });
                });
        } else if(this.state.loading_status[name]==='done') { // done -> collapsed
            this.setState((prevState)=>{
                let state=Object.assign({},prevState);
                state.loading_status[name]='collapsed';
                return state;
            });
        } else if(this.state.loading_status[name]==='collapsed') { // collapsed -> done
            this.setState((prevState)=>{
                let state=Object.assign({},prevState);
                state.loading_status[name]='done';
                return state;
            });
        }
    }

    componentDidMount() {
        window.config.auto_loading.forEach((name)=>{
            this.toggle_collapse(name);
        });
    }

    on_setfilter(begin,end) {
        let res=[];
        for(let i=begin;i<=end;i++)
            res.push(i);
        if(this.state.filter[0]!==res[0] || this.state.filter.length!==res.length)
            this.setState({
                filter: res
            });
    }

    render() {
        return (
            <div className="imasugu">
                <Title />
                <PiecesBar pieces={this.state.timepieces} initial={App.get_start_piece()} do_setfilter={this.on_setfilter.bind(this)} />
                {Object.keys(this.state.loading_status).map((name)=>(
                    <div key={name}>
                        <div className="imsg-building-bar" onClick={()=>{this.toggle_collapse(name)}}>
                            {name}
                            <span className="imsg-loading-status">{LOADING_TEXT[this.state.loading_status[name]]}</span>
                        </div>
                        <Details data={this.state.data[name]} pieces={this.state.timepieces} filter={this.state.filter}
                                blacklist={BLACKLIST[name]} collapsed={this.state.loading_status[name]==='collapsed'} />
                    </div>
                ))}
                <Footer blacklist={BLACKLIST} />
            </div>
        );
    }
}
