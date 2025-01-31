/* eslint-disable no-bitwise */

import Animation from '../modules/animation';
import AnimationSet from '../modules/animation-set';
import normalizeValue from './normalize-value';

const borderSpecialPropsArray = ['borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth'];
const borderPropsArray = ['borderWidth'];
const displayValue = typeof window !== 'undefined' && !('flex' in window.document.body.style) ? '-webkit-flex' : 'flex';

function hasOwnProperty(obj: Object, name: string | number | symbol) {
  return Object.prototype.hasOwnProperty.call(obj, name);
}

// { scale: 2 } => 'scale(2)'
// { translateX: 20 } => 'translateX(20px)'
function mapTransform(transform: any) {
  const type = Object.keys(transform)[0];
  const value = normalizeValue(type, transform[type]);
  return `${type}(${value})`;
}

function resolveTransform(transformArray: any[]): any {
  let transform = '';
  if (Array.isArray(transformArray)) {
    if (transformArray.length > 1) {
      transform = transformArray.map(mapTransform)
        .join(' ');
    } else {
      const transformItem = transformArray[0];
      const type = Object.keys(transformItem)[0];
      const value = normalizeValue(type, transformItem[type]);
      // Animation和AnimationSet只支持一个transform属性
      if (value) {
        if ((value as any) instanceof Animation) {
          transform = {
            type,
            animation: value,
          };
        } else if ((value as any) instanceof AnimationSet
          && (value as Element).children
          && (value as Element).children.length > 0
        ) {
          transform = {
            type,
            animation: (value as Element).children[0].animation,
            animationSet: value,
          };
        } else {
          transform = `${type}(${value})`;
        }
      }
    }
  } else {
    transform = transformArray;
  }
  return transform;
}

function is8DigitHexColor(color: string) {
  return color && color.length === 9 && color[0] === '#';
}

function transformHexToRgba(color: number) {
  const red = (color & 0xff000000) >>> 24;
  const green = (color & 0x00ff0000) >> 16;
  const blue = (color & 0x0000ff00) >> 8;
  const alpha = (color & 0x000000ff);
  return `rbga(${red},${green},${blue},${alpha})`;
}

function isNumeric(num: unknown) {
  if (typeof num === 'number' && Number.isFinite(num)) {
    return true;
  }
  if (typeof num === 'string') {
    return !Number.isNaN(Number(num)) && !Number.isNaN(parseFloat(num));
  }
  return false;
}

function toPx(num: unknown) {
  return isNumeric(num) ? `${num}px` : num;
}

interface WebStyle {
  borderStyle?: any,
  marginHorizontal?: any
  marginLeft?: any,
  marginRight?: any,
  marginTop?: any,
  marginBottom?: any,
  paddingLeft?: any,
  paddingRight?: any,
  paddingTop?: any,
  paddingBottom?: any,
  marginVertical?: any,
  paddingHorizontal?: any,
  paddingVertical?: any,
  color?: any
  colors?: any,
  borderColor?: any,
  borderColors?: any,
  borderTopColor?: any,
  borderTopColors?: any,
  borderBottomColor?: any,
  borderBottomColors?: any,
  borderLeftColor?: any,
  borderLeftColors?: any,
  borderRightColor?: any,
  borderRightColors?: any,
  backgroundColor?: any,
  backgroundColors?: any,
  [props: string]: any
}

function handleBoxStyle(webStyle: WebStyle) {
  // 处理普通border
  borderPropsArray.every((borderProp) => {
    if (hasOwnProperty(webStyle, borderProp)) {
      // eslint-disable-next-line no-param-reassign
      webStyle.borderStyle = 'solid';
      return false;
    }
    return true;
  });

  // 处理marginHorizontal
  if (hasOwnProperty(webStyle, 'marginHorizontal')) {
    const val = toPx(webStyle.marginHorizontal);
    /* eslint-disable no-param-reassign */
    webStyle.marginLeft = val;
    webStyle.marginRight = val;
  }

  // 处理marginVertical
  if (hasOwnProperty(webStyle, 'marginVertical')) {
    const val = toPx(webStyle.marginVertical);
    webStyle.marginTop = val;
    webStyle.marginBottom = val;
  }
  // 处理paddingHorizontal
  if (hasOwnProperty(webStyle, 'paddingHorizontal')) {
    const val = toPx(webStyle.paddingHorizontal);
    webStyle.paddingLeft = val;
    webStyle.paddingRight = val;
  }
  // 处理paddingVertical
  if (hasOwnProperty(webStyle, 'paddingVertical')) {
    const val = toPx(webStyle.paddingVertical);
    webStyle.paddingTop = val;
    webStyle.paddingBottom = val;
  }
}

// 处理颜色数组（QQ浏览器专有）
function handleSpecialColor(webStyle: WebStyle) {
  const colorStyleArr = [
    ['color', 'colors'],
    ['borderColor', 'borderColors'],
    ['borderTopColor', 'borderTopColors'],
    ['borderBottomColor', 'borderBottomColors'],
    ['borderLeftColor', 'borderLeftColors'],
    ['borderRightColor', 'borderRightColors'],
    ['backgroundColor', 'backgroundColors'],
  ];
  colorStyleArr.forEach((colorList) => {
    const [color, colors] = colorList;
    if (!webStyle[color] && webStyle[colors] && webStyle[colors].length > 0) {
      [webStyle[color]] = webStyle[colors];
    }
  });
}

function handle8BitHexColor(webStyle: WebStyle) {
  // 处理八位16进制的颜色值为rgba颜色值
  if (is8DigitHexColor(webStyle.backgroundColor)) {
    webStyle.backgroundColor = transformHexToRgba(webStyle.backgroundColor);
  }

  if (is8DigitHexColor(webStyle.color)) {
    webStyle.color = transformHexToRgba(webStyle.color);
  }

  if (is8DigitHexColor(webStyle.borderColor)) {
    webStyle.borderColor = transformHexToRgba(webStyle.borderColor);
  }

  if (is8DigitHexColor(webStyle.borderTopColor)) {
    webStyle.borderTopColor = transformHexToRgba(webStyle.borderTopColor);
  }

  if (is8DigitHexColor(webStyle.borderBottomColor)) {
    webStyle.borderBottomColor = transformHexToRgba(webStyle.borderBottomColor);
  }

  if (is8DigitHexColor(webStyle.borderLeftColor)) {
    webStyle.borderLeftColor = transformHexToRgba(webStyle.borderLeftColor);
  }

  if (is8DigitHexColor(webStyle.borderRightColor)) {
    webStyle.borderRightColor = transformHexToRgba(webStyle.borderRightColor);
  }
}

function hackWebStyle(webStyle_: any) {
  const webStyle = webStyle_;
  /*
     if (webStyle.flexDirection || webStyle.justifyContent || webStyle.alignItems) {
     }
  */
  if (!webStyle.display) {
    Object.assign(webStyle, {
      display: displayValue,
      flexDirection: webStyle.flexDirection ? webStyle.flexDirection : 'column',
    });
  }

  // hack lineHeight
  if (hasOwnProperty(webStyle, 'lineHeight')) {
    webStyle.lineHeight = toPx(webStyle.lineHeight);
  }

  if (!webStyle.position) {
    webStyle.position = 'relative';
  }

  webStyle.boxSizing = 'border-box';

  // 处理特殊 border
  borderSpecialPropsArray.forEach((borderProp) => {
    if (hasOwnProperty(webStyle, borderProp)) {
      webStyle.borderStyle = null;
      if (borderProp === 'borderTopWidth') {
        webStyle.borderTopStyle = 'solid';
      } else if (borderProp === 'borderBottomWidth') {
        webStyle.borderBottomStyle = 'solid';
      } else if (borderProp === 'borderLeftWidth') {
        webStyle.borderLeftStyle = 'solid';
      } else if (borderProp === 'borderRightWidth') {
        webStyle.borderRightStyle = 'solid';
      }
    }
  });

  handleBoxStyle(webStyle);
  if (webStyle.height && webStyle.height === 0.5) {
    webStyle.height = '1px';
  }
  handleSpecialColor(webStyle);
  // 处理八位16进制的颜色值为rgba颜色值
  handle8BitHexColor(webStyle);

  Object.keys(webStyle)
    .forEach((key) => {
      const value = webStyle[key];
      if (value) {
        if (value instanceof Animation) {
          // 动画给初始值
          webStyle[key] = value.startValue;
          value.setStyleAttribute(key);
        } else if (value instanceof AnimationSet && value.children && value.children.length > 0) {
          // 确认AnimationSet是确实有children
          const firstAnimation = value.children[0];
          webStyle[key] = firstAnimation.startValue;
          value.setStyleAttribute(key);
        }
      }
    });

  // 处理transform
  if (webStyle.transform) {
    const finalTransformStyleResult = resolveTransform(webStyle.transform);
    if (typeof finalTransformStyleResult !== 'string') {
      const { type, animation, animationSet } = finalTransformStyleResult;
      const { startValue } = animation;
      const finalStartValue = normalizeValue(type, startValue);
      if (animationSet) {
        animationSet.setTransformStyleAttribute(type);
      } else {
        animation.setTransformStyleAttribute(type);
      }

      webStyle.transform = `${type}(${finalStartValue})`;
    } else {
      webStyle.transform = finalTransformStyleResult;
    }
  }
}

function formatWebStyle(style: any) {
  const webStyle = {};

  if (Array.isArray(style)) {
    style.forEach((itemStyle) => {
      Object.assign(webStyle, itemStyle);

      hackWebStyle(webStyle);
    });
  } else {
    Object.assign(webStyle, style);

    hackWebStyle(webStyle);
  }

  return webStyle;
}

export default formatWebStyle;
export { formatWebStyle };
