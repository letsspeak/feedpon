import React, { Children, PureComponent, cloneElement } from 'react';
import classnames from 'classnames';

import createChainedFunction from 'utils/createChainedFunction';

interface MenuProps {
    children?: React.ReactNode;
    onSelect: (value?: any) => void;
    pullRight?: boolean;
}

export default class Menu extends PureComponent<MenuProps, {}> {
    static defaultProps = {
        onSelect: (value?: any) => {},
        pullRight: false
    };

    renderChild(child: React.ReactElement<any>) {
        const { onSelect } = this.props;

        return cloneElement(child, {
            ...child.props,
            onSelect: createChainedFunction(
                child.props.onSelect,
                onSelect
            )
        });
    }

    render() {
        const { children, pullRight } = this.props;

        return (
            <div className={classnames('menu', {
                'menu-pull-right': pullRight!,
            })}>
                {Children.map(children, this.renderChild.bind(this))}
            </div>
        );
    }
}
