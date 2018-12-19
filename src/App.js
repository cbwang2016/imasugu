import React, { Component, PureComponent } from 'react';
import './App.css';

const BLACKLIST={
    '理教': ['109','111','308'],
    '一教': [],
    '二教': [],
    '三教': [],
    '四教': [],
    '文史': [],
    '地学': [],
};
const BUILDINGS=['理教','一教','二教','三教','四教','文史','地学'];
const AUTO_LOADING=['理教','二教'];

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
    'collapsed': '点击显示',
    'loading':'加载中',
    'failed':'加载失败',
    'idle':'点击加载',
};

const API_BASE='//imsg.pi.xmcp.ml/classroom_proxy/retrClassRoomFree.do';

class Title extends PureComponent {
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

class PiecesBar extends PureComponent {
    constructor(props) {
        super(props);
        let sel_prop=props.initial;
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

class PieceBox extends PureComponent {
    render() {
        return (
            <span className={'piece'+(this.props.variant ? ' '+this.props.variant : '')}>
                {(this.props.text||'').substr(1)}
            </span>
        );
    }
}

class Details extends PureComponent {
    render() {
        if(this.props.data===null) return (
            <div className="details-block" />
        );

        let filter=this.props.filter.map((f)=>'c'+f);
        let pieces=this.props.pieces.map((p)=>'c'+p);
        let building=this.props.data||[];

        return (
            <div className={'details-block'+(this.props.collapsed ? '' : ' details-block-show')}>
                {building.map((b)=>
                    <div key={b.room} className={'room'+((
                                this.props.blacklist.indexOf(b.room)===-1 && filter.every((f)=>b[f]==='')
                            ) ? ' room-visible' : ' room-hidden')}>
                        <span className="desc-text">
                            <span className="text-major">{b.room.charAt(0)}</span>
                            {b.room.substr(1)}&nbsp;
                            <small>{b.cap}人</small>
                        </span>
                        {pieces.map((p)=>(
                            b[p]==='' ? (
                                <PieceBox key={p} variant={filter.indexOf(p)!==-1 ? 'piece-highlight' : null} text={p} />
                            ) : (
                                <PieceBox key={p} variant="piece-no" />
                            )
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

function Footer(props) {
    return (
        <div>
            <br />
            <p>
                教室黑名单：
                {Object.keys(props.blacklist).map((k)=>props.blacklist[k].map((r)=>k+r).join('、')).filter((x)=>x).join('、')}
            </p>
            <p>你应该发现了在页面顶部可以点击并拖拽来筛选</p>
            <p>数据来源于校内信息门户 &copy;xmcp</p>
            <br />
        </div>
    )
}

class App extends Component {
    constructor(props) {
        function mk_obj(keys,value) {
            let res={};
            for(let key of keys)
                res[key]=value;
            return res;
        }
        super(props);
        let pieces=App.get_current_pieces();
        this.state={
            loading_status: mk_obj(BUILDINGS,'idle'),
            data: mk_obj(BUILDINGS,null),
            timepieces: pieces,
            filter: [],
        }
    }

    static get_start_piece() {
        //return 5;//////
        let now=new Date();
        for(let i=1;i<TIMEPIECES.length-1;i++)
            if(now.getHours()<TIMEPIECES[i][0] || (now.getHours()===TIMEPIECES[i][0] && now.getMinutes()<TIMEPIECES[i][1]))
                return i;
        return TIMEPIECES.length-1; // impossible
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
        if(this.state.loading_status[name]==='idle' || this.state.loading_status[name]==='failed') { // load
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
        AUTO_LOADING.forEach((name)=>{
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
            <div>
                <Title />
                <PiecesBar pieces={this.state.timepieces} initial={App.get_start_piece()} do_setfilter={this.on_setfilter.bind(this)} />
                {Object.keys(this.state.loading_status).map((name)=>(
                    <div key={name}>
                        <div className="building-bar" onClick={()=>{this.toggle_collapse(name)}}>
                            {name}
                            <span className="loading-status">{LOADING_TEXT[this.state.loading_status[name]]}</span>
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

export default App;
