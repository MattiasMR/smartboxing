// src/components/boxes/BoxGrid.jsx
import BoxCard from './BoxCard';
import './BoxGrid.css';

const groupContainerStyle = {
  marginBottom: '30px',
};
const groupTitleStyle = {
  marginLeft: '10px',
  color: '#fff',
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: '5px 15px',
  borderRadius: '20px',
  display: 'inline-block',
};
const gridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
};

function BoxGrid({ boxes }) {
  // Group boxes by hallway
  const groupedBoxes = boxes.reduce((acc, box) => {
    (acc[box.hallway] = acc[box.hallway] || []).push(box);
    return acc;
  }, {});

  return (
    <div className="box-grid-wrapper">
      {Object.entries(groupedBoxes).map(([hallway, boxesInHallway]) => (
        <div key={hallway} className="box-group-container" style={groupContainerStyle}>
          <h2 className="box-group-title" style={groupTitleStyle}>{hallway}</h2>
          <div className="box-grid" style={gridStyle}>
            {boxesInHallway.map((box) => (
              <BoxCard key={box.id} box={box} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default BoxGrid;