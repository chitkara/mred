import React, {Component} from 'react'
import GridEditorApp, {Panel, Toolbar} from '../GridEditorApp'
import HypercardCanvas from './HypercardCanvas'
import {toQueryString} from '../utils'
import Selection from '../SelectionManager'
import PropSheet from '../PropSheet'
import {TREE_ITEM_PROVIDER} from "../TreeItemProvider";

export default class HypercardApp extends Component {
    constructor(props) {
        super(props)
        this.state = {
            dirty:false,
            showBounds:false,
            scale: 0
        }
    }

    componentDidMount() {
        this.props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, ()=> this.setDirty())
        this.props.provider.on(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, ()=> this.setDirty())
        this.props.provider.on(TREE_ITEM_PROVIDER.SAVED, ()=> this.clearDirty())
        this.props.provider.on(TREE_ITEM_PROVIDER.CLEAR_DIRTY, ()=> this.clearDirty())
    }
    setDirty = () => {
        if(this.state.dirty === false) this.setState({dirty:true})
        if(this.dirtyTimeout) clearTimeout(this.dirtyTimeout)
        //save every 5 minutes
        this.dirtyTimeout = setTimeout(this.checkDirty,5*60*1000)
    }
    checkDirty = () => {
        if(this.state.dirty) {
            this.props.provider.save().then(()=>{
                console.log("successfully saved")
            })
        }

    }
    clearDirty = () => {
        if(this.state.dirty === true) this.setState({dirty:false})
    }

    addCard = () => {
        const prov = this.props.provider;
        prov.appendChild(prov.getSceneRoot(),prov.createCard())
    }

    addSquare = () => {
        const prov = this.props.provider
        prov.appendChild(prov.findSelectedCard(),prov.createRect())
    }

    addText = () => {
        const prov = this.props.provider
        prov.appendChild(prov.findSelectedCard(),prov.createText())
    }

    addImage = () => {
        const prov = this.props.provider
        prov.appendChild(prov.findSelectedCard(),prov.createImage())
    }

    addFont = () => {
        const prov = this.props.provider
        prov.appendFont(prov.createFont())
    }

    deleteItem = () => {
        let nodes = Selection.getFullSelection()
        const prov = this.props.provider
        nodes.forEach((node)=>prov.deleteChild(node))
    }

    toggleBounds = () => this.setState({showBounds:!this.state.showBounds})
    zoomIn = () => this.setState({scale:this.state.scale+1})
    zoomOut = () => this.setState({scale:this.state.scale-1})

    render() {
        const prov = this.props.provider
        return <GridEditorApp provider={prov}>
            <Toolbar left top><label>{prov.getTitle()}</label></Toolbar>

            <Toolbar left bottom>
                <button className="fa fa-vcard" onClick={this.addCard}/>
                <button className="fa fa-square" onClick={this.addSquare}/>
                <button className="fa fa-text-width" onClick={this.addText}/>
                <button className="fa fa-image" onClick={this.addImage}/>
                <button className="fa fa-font" onClick={this.addFont}/>
                <button className="fa fa-close" onClick={this.deleteItem}/>
            </Toolbar>

            <Panel center middle scroll>
                <HypercardCanvas provider={prov}
                                 showBounds={this.state.showBounds}
                                 scale={this.state.scale}/>
            </Panel>

            <Panel scroll right><PropSheet provider={prov}/></Panel>


            <Toolbar center top>
                <button className="fa fa-save" onClick={prov.save}/>
                <label>{this.state.dirty?"dirty":""}</label>
                <button onClick={this.toggleBounds}>{this.state.showBounds?"hide bounds":"show bounds"}</button>
                <button onClick={this.zoomIn}>zoom in</button>
                <button onClick={this.zoomOut}>zoom out</button>
            </Toolbar>

            <Toolbar right top/>
            <Toolbar right bottom/>

        </GridEditorApp>
    }
}