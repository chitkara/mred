import * as THREE from 'three'
import React, {Component} from "react"
import GLTFLoader from './GLTFLoader'
import DRACOLoader from './DRACOLoader'
import SkeletonUtils from './SkeletonUtils'
import OrbitControls from './OrbitControls'

export default class GLTFAssetView extends Component {
    componentDidMount() {
        this.initThreeJS()
    }
    componentWillReceiveProps(nextProps, nextContext) {
        if(this.props.asset && nextProps.asset.id !== this.props.asset.id) {
            this.swapModel(nextProps.asset)
        }
    }

    swapModel(asset) {
        if(this.model) {
            this.scene.remove(this.model)
        }


        const url = this.props.provider.assetsManager.getAssetURL(asset)

        this.props.provider.getLogger().log("GLTFAssetView loading the url",url)
        if(!url) {
            this.props.provider.getLogger().error("GLTFAssetView url is empty!")
            return
        }


        const loader = new GLTFLoader()
        loader.setCrossOrigin('anonymous');
        const draco = new DRACOLoader()
        DRACOLoader.setDecoderPath( './draco/' );
        loader.setDRACOLoader( draco );

        loader.load(url, (gltf)=> {
            console.log("loaded", url)

            let model = gltf.scene || gltf.scenes[0]

            // clone it, in case the loader is returning the same cached version?
            this.model = SkeletonUtils.clone( model  );
            model = this.model
            model.updateMatrixWorld();

            let clips = gltf.animations || [];
            this.setClips(clips)

            let boundingBox = new THREE.Box3().setFromObject(model);
            let boundingBoxSize = boundingBox.getSize(new THREE.Vector3()).length();
            let BoundingBoxCenter = boundingBox.getCenter(new THREE.Vector3());

            this.controls.reset();

            // this.setClips(node.userData)
            model.position.x += model.position.x -BoundingBoxCenter.x
            model.position.y += model.position.y -BoundingBoxCenter.y
            model.position.z += model.position.z -BoundingBoxCenter.z

            this.controls.maxDistance = boundingBoxSize * 10;
            this.camera.near = boundingBoxSize / 100;
            this.camera.far = boundingBoxSize * 100;
            this.camera.updateProjectionMatrix();

            this.camera.position.copy(BoundingBoxCenter);
            this.camera.position.x += boundingBoxSize / 2.0;
            this.camera.position.y += boundingBoxSize / 5.0;
            this.camera.position.z += boundingBoxSize / 2.0;
            this.camera.lookAt(BoundingBoxCenter);

            this.controls.enabled = true;
            this.playAllClips()
            this.scene.add(model)
        })

    }

    render() {
        return <div id={"gltf-viewer"} ref={c => this.sceneContainer = c}/>
    }
    initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x000000 );
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.scene.add(this.camera)
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.gammaOutput = true
        this.sceneContainer.appendChild( this.renderer.domElement );
        this.clips = []
        this.mixer = null
        this.model = null

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.screenSpacePanning = true;

        this.renderer.setAnimationLoop(this.renderThree)

        const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
        light.position.set( 1, 1, 1 ).normalize();
        this.scene.add( light );
        this.scene.add(new THREE.AmbientLight(0xffffff,0.2))
        //console.log("rendering the asset",asset)

        this.swapModel(this.props.asset)
    }

    playAllClips () {
        this.clips.forEach((clip) => {
          this.mixer.clipAction(clip).reset().play();
        });
    }
    
    setClips ( clips ) {
        if (this.mixer) {
          this.mixer.stopAllAction();
          this.mixer.uncacheRoot(this.mixer.getRoot());
          this.mixer = null;
        }
    
        clips.forEach((clip) => {
          if (clip.validate()) clip.optimize();
        });
    
        if (!clips.length) return;
        this.clips = clips
        this.mixer = new THREE.AnimationMixer( this.model );
    }

    checkAspectRatio() {
        if(!this.renderer
            || !this.renderer.domElement
            || !this.sceneContainer
        ) return
        const w = this.sceneContainer.clientWidth
        const h = this.sceneContainer.clientHeight
        const aspect = w/h
        if(Math.abs(this.camera.aspect - aspect) > 0.001 ) {
            this.camera.aspect = aspect
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(w-4,h-4)
        }
    }

    renderThree = (time) => {
        const dt = (time - this.prevTime) / 1000;
        this.checkAspectRatio()

        this.controls.update();
        this.mixer && this.mixer.update(dt);

        this.renderer.render( this.scene, this.camera );
        this.prevTime = time;

    }

}
