import React from 'react';
import className from 'classname';

const propTypes = {
  asset: React.PropTypes.object.isRequired,
  handleSelect: React.PropTypes.func.isRequired,
  selected: React.PropTypes.string
};

class ImageCard extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    this.props.handleSelect(this.props.asset.path);
  }

  render() {
    const { asset, selected } = this.props;
    const classNames = className('image-card existing', {
      selected: selected === asset.path
    });

    return (
      <div className={classNames} onClick={this.onClick}>
        <img src={asset.download_url} title={asset.name}/>
        <span>{asset.name}</span>
      </div>
    );
  }
}

ImageCard.propTypes = propTypes;

export default ImageCard;
