import React, { Component } from 'react';
import './App.css';

const BLACKLIST={
    '理教': ['109','111','308'],
    '二教': [],
    '三教': [],
};

const TIMEPIECES=[
    [-1,-1],
    [8,0], [9,0],
    [10,10], [11,10],
    [13,0], [14,0],
    [15,10], [16,10], [17,0],
    [18,40], [19,40], [20,40],
    [999,999],
];

const LOADING_TEXT={
    'done':'',
    'loading':'加载中',
    'failed':'加载失败',
    'idle':'...',
};

const API_BASE='http://imsg.pi.xmcp.ml/classroom_proxy/retrClassRoomFree.do';

class Title extends Component {
    constructor(props) {
        super(props);
        this.state={
            switch: false
        };
    }
    switch() {
        this.setState((prevState)=>({
            switch: !prevState.switch
        }));
    }
    render() {
        return (
            <div onClick={this.switch.bind(this)}>
                {this.state.switch ?
                    <p className="title">看什么看，<b>现在去自习</b>呀~</p> :
                    <p className="title"><b>今すぐ</b>、勉強しよう~</p>
                }
            </div>
        );
    }
}

class PiecesBar extends Component {
    constructor(props) {
        super(props);
        let sel_prop=props.pieces.length>1?props.pieces[1]:props.pieces[0];
        props.do_setfilter(sel_prop,sel_prop);
        this.state={
            sel_base: sel_prop,
            sel_end: sel_prop,
        };
    }

    sel_minmax() {
        let {sel_base: a, sel_end: b}=this.state;
        return a<=b ? [a,b] : [b,a];
    }

    on_click(p) {
        this.setState({
            sel_base: p,
            sel_end: p,
        },()=>{
            let [sel_mi,sel_ma]=this.sel_minmax();
            this.props.do_setfilter(sel_mi,sel_ma);
        });
    }
    on_drag(p) {
        this.setState({
            sel_end: p,
        },()=>{
            let [sel_mi,sel_ma]=this.sel_minmax();
            this.props.do_setfilter(sel_mi,sel_ma);
        });
    }
    fix_coord(e) {
        if(e.touches.length===0) return;
        let elem=document.elementFromPoint(e.touches[0].clientX,e.touches[0].clientY);
        if(elem && elem.dataset['pid'])
            this.on_drag(elem.dataset['pid']);
    }

    render() {
        let [sel_mi,sel_ma]=this.sel_minmax();
        return (
            <div className="pieces-list">
                <span className="desc-text">筛选时间</span>
                {this.props.pieces.map((p)=>(
                    <span key={p} data-pid={p} className={'piece'+(p>=sel_mi && p<=sel_ma ? ' piece-highlight' : '')}
                            onMouseDown={()=>{this.on_click(p)}} onMouseMove={(e)=>{if(e.buttons===1) this.on_drag(p)}}
                            onTouchStart={()=>{this.on_click(p)}} onTouchMoveCapture={(e)=>{this.fix_coord(e)}}>
                        {p}
                    </span>
                ))}
                <span role="img" className="piece" aria-label="NIGHT">😎</span>
            </div>
        )
    }
}

function Details(props) {
    if(props.data===null) return null;

    let filter=props.filter.map((f)=>'c'+f);
    let pieces=props.pieces.map((p)=>'c'+p);
    let building=props.data.filter((b)=>props.blacklist.indexOf(b.room)===-1 && filter.every((f)=>b[f]===''));

    return (
        <div>
            {building.map((b)=>(
                <div key={b.room} className="room">
                    <span className="desc-text">{b.room} <small>{b.cap}人</small></span>
                    {pieces.map((p)=>(
                        b[p]==='' ?
                            <span key={p} className={'piece'+(filter.indexOf(p)!==-1 ? ' piece-highlight' : '')}>
                                {p.substr(1)}
                            </span> :
                            <span key={p} className="piece piece-no" />
                    ))}
                </div>
            ))}
        </div>
    );
}

function Footer(props) {
    return (
        <div>
            <br />
            <p>
                教室黑名单：
                {Object.keys(props.blacklist).map((k)=>props.blacklist[k].map((r)=>k+r).join('、')).filter((x)=>x).join('、')}
            </p>
            <p>你应该已经发现了在页面顶部可以点击并拖拽来筛选</p>
            <p>数据来源于校内信息门户 &copy;xmcp</p>
            <br />
        </div>
    )
}

class App extends Component {
    constructor(props) {
        super(props);
        let pieces=App.get_current_pieces();
        this.state={
            loading_status: {
                '理教': 'idle',
                '二教': 'idle',
                '三教': 'idle',
            },
            data: {
                '理教': null,
                '二教': null,
                '三教': null,
            },
            timepieces: pieces,
            filter: [],
        }
    }

    static get_start_piece() {
        //return 5;//////
        let now=new Date();
        for(let i=2;i<TIMEPIECES.length;i++)
            if(now.getHours()<TIMEPIECES[i][0] || (now.getHours()===TIMEPIECES[i][0] && now.getMinutes()<TIMEPIECES[i][1]))
                return i-1;
        return TIMEPIECES.length-1; // impossible
    }
    static get_current_pieces() {
        let start=this.get_start_piece();
        let ret=[];
        for(let i=start;i<TIMEPIECES.length-1;i++)
            ret.push(i);
        if(ret.length===0) // impossible
            throw Error('no timepieces');
        return ret;
    }

    load_data(name) {
        this.setState((prevState)=>{
            let state=Object.assign({},prevState);
            state.loading_status[name]='loading';
            return state;
        });

        fetch(API_BASE+'?buildingName='+encodeURIComponent(name)+'&time='+encodeURIComponent('今天'))
            .then((res)=>res.json())
            .then((json)=>{
                if(!json.success)
                    throw json;
                this.setState((prevState)=>{
                    let state=Object.assign({},prevState);
                    state.loading_status[name]='done';
                    state.data[name]=json.rows;
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
    }

    componentDidMount() {
        Object.keys(this.state.loading_status).forEach((name)=>{
            this.load_data(name);
        });
    }

    on_setfilter(begin,end) {
        let res=[];
        for(let i=begin;i<=end;i++)
            res.push(i);
        this.setState({
            filter: res
        });
    }

    render() {
        return (
            <div>
                <Title />
                <PiecesBar pieces={this.state.timepieces} do_setfilter={this.on_setfilter.bind(this)} />
                {Object.keys(this.state.loading_status).map((name)=>(
                    <div key={name}>
                        <div className="building-bar">
                            {name}
                            <span className="loading-status">{LOADING_TEXT[this.state.loading_status[name]]}</span>
                            {this.state.loading_status[name]==='failed' &&
                                <button className="reload" onClick={()=>{this.load_data(name)}}>
                                    重试
                                </button>
                            }
                        </div>
                        <Details data={this.state.data[name]} pieces={this.state.timepieces} filter={this.state.filter} blacklist={BLACKLIST[name]} />
                    </div>
                ))}
                <Footer blacklist={BLACKLIST} />
            </div>
        );
    }
}

export default App;
