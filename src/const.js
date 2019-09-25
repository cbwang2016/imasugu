import {PKUHELPER_ROOT} from './infrastructure/const';

export const BLACKLIST={
    '理教': ['109','111','308'],
    '一教': [],
    '二教': ['514','523','518','526','530','521','524','528','529','516'],
    '三教': [],
    '四教': ['405','407','409','503','504','505','506','507','509','511'],
    '文史': [],
    '地学': [],
};
export const BUILDINGS=['理教','一教','二教','三教','四教','文史','地学'];
export const AUTO_LOADING=['理教','二教'];

export const TIMEPIECES=[
    [-1,-1],
    [8,0], [9,0],
    [10,10], [11,10],
    [13,0], [14,0],
    [15,10], [16,10], [17,0],
    [18,40], [19,40], [20,40],
    [999,999],
];

export const API_BASE=`${PKUHELPER_ROOT}api_xmcp/isop/classroom_today?buildingName={building}`;