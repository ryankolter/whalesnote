import styled from '@emotion/styled';

interface SvgIconProps
    extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    iconWidth: number;
    iconHeight: number;
    iconSrc: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({ iconWidth, iconHeight, iconSrc, ...restProps }) => {
    return (
        <Icon width={iconWidth} height={iconHeight} {...restProps}>
            <IconImg width={iconWidth} height={iconHeight} src={iconSrc} alt="" />
        </Icon>
    );
};

const Icon = styled.div({}, (props: { width: number; height: number }) => ({
    width: props.width + 'px',
    height: props.height + 'px',
}));

const IconImg = styled.img({}, (props: { width: number; height: number }) => ({
    width: props.width + 'px',
    height: props.height + 'px',
}));

export default SvgIcon;
