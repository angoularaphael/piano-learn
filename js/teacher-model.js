// Le prof, une vraie personne : deux avatars de la bibliotheque Microsoft Rocketbox (licence MIT),
// convertis pour le web (models/*.glb : squelette complet, doigts a trois phalanges, yeux, 24 expressions).
// - On choisit son prof (reglage 'prof') : la professeure au chemisier bleu ou le professeur grisonnant.
// - Le squelette 3ds Max (Bip01 ...) est expose sous les noms logiques de la pose procedurale (teacher.js),
//   avec un bout de doigt ajoute au bout de chaque derniere phalange (le point qui vise la touche).
// - Les expressions (cligner, sourire, s'inquieter, s'etonner, se concentrer, parler) passent par les
//   formes du visage, sur les trois maillages (corps, tete, cheveux).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getSettings } from './progress.js';

export const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

export const TEACHERS = {
  femme: { file: 'models/prof-femme.glb', nom: { fr: 'Elle', en: 'Her' } },
  homme: { file: 'models/prof-homme.glb', nom: { fr: 'Lui', en: 'Him' } },
};
export const teacherChoice = () => (TEACHERS[getSettings().prof] ? getSettings().prof : 'femme');

// Noms logiques -> os Rocketbox (les espaces deviennent des _ au chargement)
const BONES = {
  Hips: 'Pelvis', Spine: 'Spine', Spine1: 'Spine1', Spine2: 'Spine2', Neck: 'Neck', Head: 'Head',
  LeftEye: 'LEye', RightEye: 'REye',
};
for (const [S, s] of [['Left', 'L'], ['Right', 'R']]) {
  Object.assign(BONES, {
    [`${S}Shoulder`]: `${s}_Clavicle`, [`${S}Arm`]: `${s}_UpperArm`, [`${S}ForeArm`]: `${s}_Forearm`, [`${S}Hand`]: `${s}_Hand`,
    [`${S}UpLeg`]: `${s}_Thigh`, [`${S}Leg`]: `${s}_Calf`, [`${S}Foot`]: `${s}_Foot`, [`${S}ToeBase`]: `${s}_Toe0`,
  });
  FINGERS.forEach((f, n) => {
    BONES[`${S}Hand${f}1`] = `${s}_Finger${n}`;
    BONES[`${S}Hand${f}2`] = `${s}_Finger${n}1`;
    BONES[`${S}Hand${f}3`] = `${s}_Finger${n}2`;
  });
}

// Les expressions : chaque humeur est un melange de formes du visage
export const MOODS = {
  idle: { AK_44_MouthSmileLeft: 0.14, AK_45_MouthSmileRight: 0.14 },
  focus: { AK_01_BrowDownLeft: 0.22, AK_02_BrowDownRight: 0.22, AK_19_EyeSquintLeft: 0.18, AK_20_EyeSquintRight: 0.18, AK_36_MouthPressLeft: 0.2, AK_37_MouthPressRight: 0.2 },
  happy: { AK_44_MouthSmileLeft: 0.78, AK_45_MouthSmileRight: 0.78, AK_07_CheekSquintLeft: 0.45, AK_08_CheekSquintRight: 0.45, AK_19_EyeSquintLeft: 0.28, AK_20_EyeSquintRight: 0.28 },
  sorry: { AK_03_BrowInnerUp: 0.7, AK_30_MouthFrownLeft: 0.32, AK_31_MouthFrownRight: 0.32, AK_44_MouthSmileLeft: 0.12, AK_45_MouthSmileRight: 0.12 },
  wow: { AK_21_EyeWideLeft: 0.55, AK_22_EyeWideRight: 0.55, AK_03_BrowInnerUp: 0.45, AK_04_BrowOuterUpLeft: 0.5, AK_05_BrowOuterUpRight: 0.5, AK_25_JawOpen: 0.22 },
  listen: { AK_03_BrowInnerUp: 0.22, AK_04_BrowOuterUpLeft: 0.18, AK_05_BrowOuterUpRight: 0.18, AK_44_MouthSmileLeft: 0.1, AK_45_MouthSmileRight: 0.1 },
};

const cache = new Map();
const loader = new GLTFLoader();

export function loadTeacherModel(choice = teacherChoice()) {
  if (cache.has(choice)) return cache.get(choice);
  const p = loader.loadAsync(TEACHERS[choice].file).then((gltf) => setup(gltf.scene, choice));
  p.catch(() => cache.delete(choice));
  cache.set(choice, p);
  return p;
}

function setup(scene, choice) {
  const group = new THREE.Group();
  group.add(scene);
  scene.updateMatrixWorld(true);

  const bones = {};
  for (const [logical, name] of Object.entries(BONES)) {
    const b = scene.getObjectByName(`Bip01_${name}`);
    if (b) bones[logical] = b;
  }

  // Bout des doigts : prolonge la derniere phalange de la longueur de la precedente (en pose de repos)
  const a = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (const S of ['Left', 'Right']) {
    FINGERS.forEach((f) => {
      const j2 = bones[`${S}Hand${f}2`];
      const j3 = bones[`${S}Hand${f}3`];
      if (!j2 || !j3) return;
      j2.getWorldPosition(a);
      j3.getWorldPosition(c);
      const tipWorld = c.clone().add(c.clone().sub(a).multiplyScalar(f === 'Thumb' ? 0.95 : 0.85));
      const tip = new THREE.Object3D();
      tip.name = `${S}Hand${f}4`;
      j3.add(tip);
      tip.position.copy(j3.worldToLocal(tipWorld));
      bones[tip.name] = tip;
    });
  }

  // La pose de repos (celle du fichier) : chaque image du prof repart de la
  const rest = new Map();
  scene.traverse((o) => { if (o.isBone) rest.set(o, o.quaternion.clone()); });

  // Materiaux : peau et tissus un peu mats ; cheveux et cils decoupes nets (pas de tri de transparence)
  const meshes = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    meshes.push(o);
    const m = o.material;
    if (m.transparent || /opacity/i.test(m.name)) {
      m.transparent = false;
      m.alphaTest = 0.42;
      m.alphaToCoverage = true;
      m.side = THREE.DoubleSide;
      m.depthWrite = true;
    } else {
      m.roughness = Math.max(m.roughness, 0.58);
    }
    // Le fichier ne dit rien du metal, et glTF vaut alors 1 : la peau devenait du cuivre poli
    // (teint orange, facettes du visage visibles, tissus noirs sans aucune lumiere). Rien n'est metal ici.
    m.metalness = 0;
    m.envMapIntensity = 0.85;
  });
  const morphs = meshes.filter((m) => m.morphTargetDictionary);
  const names = morphs.length ? Object.keys(morphs[0].morphTargetDictionary) : [];
  const setMorph = (name, v) => {
    for (const m of morphs) {
      const i = m.morphTargetDictionary[name];
      if (i !== undefined) m.morphTargetInfluences[i] = v;
    }
  };

  group.userData.body = { bones, rest, meshes, morphNames: names, setMorph, choice };
  group.userData.hips = bones.Hips.position.clone();
  return group;
}
