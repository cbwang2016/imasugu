import React, { Component, PureComponent } from 'react';
import {Appswitcher, GlobalTitle, AppSwitcher} from './infrastructure/widgets';

export default function Title(props) {
    return (
        <div>
            <AppSwitcher appid="imasugu" />
            <GlobalTitle text="空闲教室" />
        </div>
    )
}