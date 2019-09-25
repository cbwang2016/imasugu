import React, {Component, PureComponent} from 'react';

export class PiecesBar extends PureComponent {
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
            <div className="imsg-pieces-list">
                <span className="imsg-desc-text">筛选时间</span>
                {this.props.pieces.map((p)=>(
                    <span key={p} data-pid={p} className={'imsg-piece'+(p>=sel_mi && p<=sel_ma ? ' imsg-piece-highlight' : '')}
                          onMouseDown={()=>{this.on_click(p)}} onMouseMove={(e)=>{if(e.buttons===1) this.on_drag(p)}}
                          onTouchStart={()=>{this.on_click(p)}} onTouchMoveCapture={(e)=>{this.fix_coord(e)}}>
                        {p}
                    </span>
                ))}
                <span role="img" className="imsg-piece" aria-label="NIGHT">😎</span>
            </div>
        )
    }
}

class PieceBox extends PureComponent {
    render() {
        return (
            <span className={'imsg-piece'+(this.props.variant ? ' '+this.props.variant : '')}>
                {(this.props.text||'').substr(1)}
            </span>
        );
    }
}

export class Details extends PureComponent {
    render() {
        if(this.props.data===null) // failed or not loaded
            return null;
        else if(!this.props.collapsed && this.props.data.length===0) // empty response from isop
            return (
                <div className="imsg-details-block-empty">暂无数据</div>
            );

        let filter=this.props.filter.map((f)=>'c'+f);
        let pieces=this.props.pieces.map((p)=>'c'+p);
        let building=this.props.data||[];

        return (
            <div className={'imsg-details-block'+(this.props.collapsed ? '' : ' imsg-details-block-show')}>
                {building.map((b)=>
                    <div key={b.room} className={'imsg-room'+((
                        this.props.blacklist.indexOf(b.room)===-1 && filter.every((f)=>b[f]==='')
                    ) ? ' imsg-room-visible' : ' imsg-room-hidden')}>
                        <span className="imsg-desc-text">
                            <span className="imsg-text-major">{b.room.charAt(0)}</span>
                            {b.room.substr(1)}&nbsp;
                            <small>{b.cap}人</small>
                        </span>
                        {pieces.map((p)=>(
                            b[p]==='' ? (
                                <PieceBox key={p} variant={filter.indexOf(p)!==-1 ? 'imsg-piece-highlight' : null} text={p} />
                            ) : (
                                <PieceBox key={p} variant="imsg-piece-no" />
                            )
                        ))}
                    </div>
                )}
            </div>
        );
    }
}