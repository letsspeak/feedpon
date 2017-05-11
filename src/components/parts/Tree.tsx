import React, { Children, PureComponent, cloneElement } from 'react';
import classnames from 'classnames';

interface TreeProps {
    children?: React.ReactNode;
    isExpanded: boolean;
    onSelect?: (value: any) => void;
    selectedValue?: any;
}

class Tree extends PureComponent<TreeProps, {}> {
    constructor(props: TreeProps, context: any) {
        super(props, context);

        this.handleSelect = this.handleSelect.bind(this);
    }

      shouldComponentUpdate(nextProps: TreeProps, nextState: {}) {
          return nextProps.isExpanded &&
                 (this.props.children !== nextProps.selectedValue ||
                  this.props.selectedValue !== nextProps.selectedValue);
      }

    handleSelect(selectedValue: any) {
        const { onSelect } = this.props;

        if (onSelect) {
            onSelect(selectedValue);
        }
    }


    renderChild(child: React.ReactElement<any>) {
        if (child) {
            if (child.type === TreeBranch) {
                const { selectedValue } = this.props;
                const shouldExpand = (child: React.ReactElement<any>): boolean => {
                    return (child.type === TreeLeaf && child.props.value === selectedValue) ||
                           (child.type === TreeBranch && Children.toArray(child.props.children).some(shouldExpand));
                };

                return cloneElement(child, {
                    ...child.props,
                    isExpanded: child.props.isExpanded || shouldExpand(child),
                    onSelect: this.handleSelect,
                    selectedValue
                });
            }

            if (child.type === TreeLeaf) {
                const { selectedValue } = this.props;

                return cloneElement(child, {
                    ...child.props,
                    isSelected: child.props.value === selectedValue,
                    onSelect: this.handleSelect
                });
            }
        }

        return child;
    }

    render() {
        const { children } = this.props;

        return (
            <ol className="tree">
                {Children.map(children, this.renderChild.bind(this))}
            </ol>
        );
    }
}

interface TreeRootProps {
    children?: React.ReactNode;
    onSelect?: (value: any) => void;
    selectedValue?: any;
}

interface TreeRootState {
    selectedValue?: any;
}

export class TreeRoot extends PureComponent<TreeRootProps, TreeRootState> {
    constructor(props: TreeProps, context: any) {
        super(props, context);

        this.state = {
            selectedValue: props.selectedValue
        };

        this.handleSelect = this.handleSelect.bind(this);
    }

    componentWillReceiveProps(nextProps: TreeProps) {
        if (this.props.selectedValue !== nextProps.selectedValue) {
            this.setState({
                selectedValue: nextProps.selectedValue
            });
        }
    }

    handleSelect(selectedValue: any) {
        const { onSelect } = this.props;

        if (onSelect) {
            onSelect(selectedValue);
        }

        this.setState({ selectedValue });
    }

    render() {
        const { children } = this.props;
        const { selectedValue } = this.state;

        return (
            <Tree isExpanded={true}
                  onSelect={this.handleSelect}
                  selectedValue={selectedValue}>{children}</Tree>
        );
    }
}

interface TreeBranchProps {
    children?: React.ReactNode;
    className?: string;
    href?: string;
    isExpanded?: boolean;
    onSelect?: (value: any) => void;
    primaryText: string;
    secondaryText?: string;
    selectedValue?: any;
    title?: string;
    value: any;
}

interface TreeBranchState {
    isExpanded: boolean;
}

export class TreeBranch extends PureComponent<TreeBranchProps, TreeBranchState> {
    static defaultProps = {
        href: '#',
        isExpanded: false
    }

    constructor(props: TreeBranchProps, context: any) {
        super(props, context);

        this.state = {
            isExpanded: !!props.isExpanded,
        };

        this.handleExpand = this.handleExpand.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    componentWillReceiveProps(nextProps: TreeBranchProps) {
        if (this.props.isExpanded !== nextProps.isExpanded) {
            this.setState(state => ({
                ...state,
                isExpanded: nextProps.isExpanded || state.isExpanded,
            }));
        }
    }

    handleExpand(event: React.SyntheticEvent<any>) {
        event.preventDefault();

        const { isExpanded } = this.state;

        this.setState({
            isExpanded: !isExpanded,
        });
    }

    handleSelect(event: React.SyntheticEvent<any>) {
        event.preventDefault();

        const { onSelect, selectedValue, value } = this.props;

        if (onSelect && value !== selectedValue) {
            onSelect(value);
        }
    }

    render() {
        const { onSelect, children, className, href, primaryText, secondaryText, selectedValue, title, value } = this.props;
        const { isExpanded } = this.state;

        return (
            <li>
                <div className={classnames('tree-node', className, { 'is-selected': value === selectedValue, 'is-expanded': isExpanded } )}>
                    <a className="tree-node-icon" href="#" onClick={this.handleExpand}>
                        {isExpanded ? <i className="icon icon-16 icon-angle-down" /> : <i className="icon icon-16 icon-angle-right" />}
                    </a>
                    <a className="tree-node-label" href={href} title={title} onClick={this.handleSelect}>
                        <span className="tree-node-primary-text">{primaryText}</span>
                        <span className="tree-node-secondary-text">{secondaryText}</span>
                    </a>
                </div>
                <Tree isExpanded={isExpanded}
                      selectedValue={selectedValue}
                      onSelect={onSelect}>{children}</Tree>
            </li>
        );
    }
}

interface TreeLeafProps {
    className?: string;
    href?: string;
    icon?: React.ReactElement<any>;
    isSelected?: boolean;
    onSelect?: (value: any) => void;
    primaryText: string;
    secondaryText?: string;
    title?: string;
    value: any;
}

export class TreeLeaf extends PureComponent<TreeLeafProps, {}> {
    static defaultProps = {
        href: '#',
        isSelected: false
    }

    constructor(props: TreeLeafProps, context: any) {
        super(props, context);

        this.handleSelect = this.handleSelect.bind(this);
    }

    handleSelect(event: React.SyntheticEvent<any>) {
        event.preventDefault();

        const { isSelected, onSelect, value } = this.props;

        if (onSelect && !isSelected) {
            onSelect(value);
        }
    }

    render() {
        const { className, href, icon, isSelected, primaryText, secondaryText, title } = this.props;

        return (
            <li>
                <a className={classnames('tree-node', className, { 'is-selected': isSelected } )}
                   href={href}
                   title={title}
                   onClick={this.handleSelect}>
                    {icon ? <span className="tree-node-icon">{icon}</span> : null}
                    <span className="tree-node-label">
                        <span className="tree-node-primary-text">{primaryText}</span>
                        <span className="tree-node-secondary-text">{secondaryText}</span>
                    </span>
                </a>
            </li>
        );
    }
}

interface TreeHeaderProps {
    children?: React.ReactNode
}

export class TreeHeader extends PureComponent<TreeHeaderProps, {}> {
    render() {
        const { children } = this.props;

        return (
            <li>
                <div className="tree-header">
                    {children}
                </div>
            </li>
        );
    }
}
